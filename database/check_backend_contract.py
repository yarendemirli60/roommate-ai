"""Read-only source contract check. Never imports or rewrites backend code."""
import ast
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_FIELDS = {'kira_butcesi_min', 'kira_butcesi_max', 'sigara_durumu'}


def check(root):
    model_path = root / 'backend' / 'profil' / 'models.py'
    migration_path = root / 'backend' / 'profil' / 'migrations' / '0002_profil_ai_uyumluluk_alanlari.py'
    if not model_path.is_file():
        return ['backend/profil/models.py bulunamadi.']
    tree = ast.parse(model_path.read_text(encoding='utf-8-sig'))
    profile = next((node for node in tree.body if isinstance(node, ast.ClassDef) and node.name == 'Profil'), None)
    names = set()
    if profile:
        for node in profile.body:
            if isinstance(node, ast.Assign):
                names.update(target.id for target in node.targets if isinstance(target, ast.Name))
    issues = [f'Profil modelinde eksik alan: {name}' for name in sorted(EXPECTED_FIELDS - names)]
    if not migration_path.is_file():
        issues.append('Mevcut calisan surumun profil.0002 migration dosyasi bu backend branchinde yok.')
    return issues


if __name__ == '__main__':
    issues = check(ROOT)
    if issues:
        print('BACKEND UYUMU BEKLENIYOR:')
        for issue in issues:
            print('- ' + issue)
        print('Backend dosyalari degistirilmedi. Ayrintilar: database/BACKEND_UYUM_NOTU.md')
        sys.exit(1)
    print('Backend kaynak veri sozlesmesi uygun. Veritabani migration durumunu ayrica kontrol edin.')
