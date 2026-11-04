"""Exercise existing HTTP APIs and verify their persisted PostgreSQL data.

Run using verify.ps1. Creates/updates only a dedicated verification account;
never deletes or resets existing data. Credentials stay in ignored .local/.
"""
import json
import os
import secrets
import uuid
from decimal import Decimal
from http.cookiejar import CookieJar
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import HTTPCookieProcessor, Request, build_opener

import psycopg

ROOT = Path(__file__).resolve().parents[1]
BASE = 'http://127.0.0.1:5173'
RESULTS = []
WARNINGS = []


def passed(label):
    RESULTS.append(label)
    print('PASS:', label)


class Client:
    def __init__(self):
        self.cookies = CookieJar()
        self.opener = build_opener(HTTPCookieProcessor(self.cookies))

    def request(self, path, method='GET', data=None, csrf=True):
        headers = {'Accept': 'application/json', 'Origin': BASE}
        if data is not None:
            headers['Content-Type'] = 'application/json'
        if method != 'GET' and csrf:
            token = next((c.value for c in self.cookies if c.name == 'csrftoken'), '')
            if token:
                headers['X-CSRFToken'] = token
        req = Request(BASE + path, data=None if data is None else json.dumps(data).encode(), headers=headers, method=method)
        try:
            response = self.opener.open(req, timeout=15)
        except HTTPError as error:
            response = error
        content = response.read()
        return response.status, json.loads(content) if 'application/json' in response.headers.get('Content-Type', '') else None

    def csrf(self):
        status, _ = self.request('/api/session-csrf/')
        assert status == 200
        assert any(c.name == 'csrftoken' for c in self.cookies)


def db():
    return psycopg.connect(host='localhost', port=5433, dbname='roommate_ai', user='roommate_app', password=os.environ['DB_PASSWORD'])


def expect_db_error(connection, sql, params, expected):
    try:
        with connection.transaction():
            connection.execute(sql, params)
    except expected:
        return
    raise AssertionError('Expected database constraint rejection')


def main():
    credential_file = ROOT / '.local' / 'verification-account.json'
    credential_file.parent.mkdir(exist_ok=True)
    if credential_file.exists():
        credentials = json.loads(credential_file.read_text(encoding='utf-8'))
    else:
        credentials = {'kullanici_adi': 'verify_' + uuid.uuid4().hex[:10], 'eposta': 'verify_' + uuid.uuid4().hex[:10] + '@example.com', 'sifre': secrets.token_urlsafe(24)}
        credential_file.write_text(json.dumps(credentials), encoding='utf-8')
    client = Client()
    assert client.request('/api/profil/')[0] == 403
    passed('Anonymous profile access denied')
    client.csrf()
    assert client.request('/api/kayit/', 'POST', {'kullanici_adi': '', 'eposta': 'invalid', 'sifre': '123'})[0] == 400
    passed('Invalid registration rejected')
    with db() as connection:
        exists = connection.execute('SELECT id FROM auth_user WHERE username=%s', (credentials['kullanici_adi'],)).fetchone()
    if not exists:
        assert client.request('/api/kayit/', 'POST', credentials)[0] == 201
    assert client.request('/api/kayit/', 'POST', credentials)[0] == 400
    passed('Registration and duplicate account protection')
    assert client.request('/api/giris/', 'POST', {'kullanici_adi': credentials['kullanici_adi'], 'sifre': 'incorrect-test-password'})[0] == 400
    passed('Wrong password rejected')
    status, result = client.request('/api/giris/', 'POST', credentials)
    assert status == 200
    user_id = result['kullanici']['id']
    passed('Session login through frontend proxy with CSRF')
    assert client.request('/api/profil/', 'PATCH', {'hakkimda': 'must not be saved'}, csrf=False)[0] == 403
    passed('Authenticated profile mutation without CSRF denied')
    csrf_probe = Client()
    probe_status, _ = csrf_probe.request('/api/giris/', 'POST', credentials, csrf=False)
    if probe_status == 200:
        WARNINGS.append('Existing anonymous login endpoint accepts valid credentials without a CSRF token. Backend owner must review decorators; backend files were not modified.')
        print('NOTE: Existing anonymous login CSRF behavior requires backend-owner review.')
        assert csrf_probe.request('/api/cikis/', 'POST', {})[0] == 200
    else:
        assert probe_status == 403
    profile = {
        'ad': 'Test', 'soyad': 'Doğrulama', 'yas': 23, 'sehir': 'İstanbul', 'ilce': 'Kadıköy', 'meslek': 'Entegrasyon testi',
        'hakkimda': 'Otomatik doğrulama hesabıdır; gerçek aday değildir.', 'kullanim_amaci': 'birlikte_ev',
        'aranan_sehir': 'İstanbul', 'aranan_ilceler': ['Kadıköy', 'Üsküdar'], 'kira_butcesi_min': '10000.00', 'kira_butcesi_max': '15000.00',
        'sigara': False, 'sigara_durumu': 'non_smoker', 'evcil_hayvan': False, 'temizlik': 4, 'gurultu': 2,
        'sigara_kabulu': 'hayir', 'evcil_hayvan_kabulu': 'evet', 'minimum_temizlik': 3, 'maksimum_gurultu': 2,
    }
    status, _ = client.request('/api/profil/')
    assert status in (200, 404)
    if status == 404:
        assert client.request('/api/profil/olustur/', 'POST', profile)[0] == 201
    else:
        assert client.request('/api/profil/', 'PATCH', profile)[0] == 200
    passed('Profile creation with lifestyle preferences')
    assert client.request('/api/profil/olustur/', 'POST', profile)[0] == 400
    assert client.request('/api/profil/', 'PATCH', {'yas': 17})[0] == 400
    passed('Duplicate profile and underage validation')
    assert client.request('/api/profil/', 'PATCH', {'meslek': 'Güncellenmiş test profili', 'kira_butcesi_max': '16000.00'})[0] == 200
    status, retrieved = client.request('/api/profil/')
    assert status == 200 and retrieved['meslek'] == 'Güncellenmiş test profili'
    assert Decimal(retrieved['kira_butcesi_max']) == Decimal('16000')
    passed('Profile update and API readback')
    with db() as connection:
        row = connection.execute('SELECT p.meslek, p.kira_butcesi_max, p.aranan_ilceler, p.sigara_durumu, u.password FROM profil_profil p JOIN auth_user u ON u.id=p.kullanici_id WHERE u.id=%s', (user_id,)).fetchone()
        assert row[:4] == ('Güncellenmiş test profili', Decimal('16000'), ['Kadıköy', 'Üsküdar'], 'non_smoker')
        assert row[4] != credentials['sifre'] and row[4].startswith('pbkdf2_')
        migration = connection.execute("SELECT count(*) FROM django_migrations WHERE app='profil' AND name='0002_profil_ai_uyumluluk_alanlari'").fetchone()[0]
        assert migration == 1
    passed('Independent PostgreSQL connection confirms persisted data and hashed password')
    with db() as connection:
        expect_db_error(connection, 'UPDATE profil_profil SET kira_butcesi_min=20000 WHERE kullanici_id=%s', (user_id,), psycopg.errors.CheckViolation)
    passed('PostgreSQL rejects reversed budget range; transaction rolled back')
    with db() as connection:
        other = connection.execute('SELECT id FROM auth_user WHERE id<>%s ORDER BY id LIMIT 1', (user_id,)).fetchone()
        assert other, 'Create the UI demo account before the messaging constraint test'
        a, b = sorted([user_id, other[0]])
        try:
            with connection.transaction():
                conversation_id = connection.execute('INSERT INTO roommate_conversation(kullanici_a_id,kullanici_b_id) VALUES (%s,%s) RETURNING id', (a, b)).fetchone()[0]
                message_id = connection.execute('INSERT INTO roommate_message(konusma_id,kullanici_a_id,kullanici_b_id,gonderen_id,icerik) VALUES (%s,%s,%s,%s,%s) RETURNING id', (conversation_id, a, b, user_id, 'Sadece transaction içinde doğrulama mesajı')).fetchone()[0]
                assert connection.execute('SELECT icerik FROM roommate_message WHERE id=%s', (message_id,)).fetchone()
                expect_db_error(connection, 'INSERT INTO roommate_message(konusma_id,kullanici_a_id,kullanici_b_id,gonderen_id,icerik) VALUES (%s,%s,%s,%s,%s)', (conversation_id, a, b, user_id, '   '), psycopg.errors.CheckViolation)
                expect_db_error(connection, 'INSERT INTO roommate_message(konusma_id,kullanici_a_id,kullanici_b_id,gonderen_id,icerik) VALUES (%s,%s,%s,%s,%s)', (conversation_id, a, b, 2147483647, 'invalid sender'), psycopg.errors.CheckViolation)
                expect_db_error(connection, 'INSERT INTO roommate_match(kullanici_id,aday_id) VALUES (%s,%s)', (user_id, user_id), psycopg.errors.CheckViolation)
                expect_db_error(connection, 'INSERT INTO roommate_conversation(kullanici_a_id,kullanici_b_id) VALUES (%s,%s)', (a, b), psycopg.errors.UniqueViolation)
                raise psycopg.Rollback()
        finally:
            connection.rollback()
    passed('Message insert/read and membership, body, conversation uniqueness, self-match constraints; all temporary rows rolled back')
    assert client.request('/api/cikis/', 'POST', {})[0] == 200
    assert client.request('/api/profil/')[0] == 403
    passed('Logout revokes access')
    new_client = Client()
    new_client.csrf()
    assert new_client.request('/api/giris/', 'POST', credentials)[0] == 200
    assert new_client.request('/api/profil/')[1]['meslek'] == 'Güncellenmiş test profili'
    assert new_client.request('/api/cikis/', 'POST', {})[0] == 200
    passed('Fresh HTTP session retrieves committed profile')
    report = {'passed': len(RESULTS), 'checks': RESULTS, 'warnings': WARNINGS, 'test_user_id': user_id, 'deletions': 0}
    (ROOT / '.local' / 'verification-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'{len(RESULTS)} checks passed. No existing data deleted.')


if __name__ == '__main__':
    main()
