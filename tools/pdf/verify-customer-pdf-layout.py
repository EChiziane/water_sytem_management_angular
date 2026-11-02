from pathlib import Path
import pdfplumber

paths = [Path('output/pdf/ficha-cliente-a4.pdf'), Path('tmp/pdfs/cliente-historico-longo.pdf'), Path('tmp/pdfs/cliente-resumo.pdf')]
for path in paths:
    with pdfplumber.open(path) as pdf:
        text = '\n'.join(page.extract_text() or '' for page in pdf.pages)
        assert 'FICHA DO CLIENTE' in text, path
        assert 'Situação da conta' in text, path
        for i, page in enumerate(pdf.pages, 1):
            assert abs(page.width - 595.28) < 1 and abs(page.height - 841.89) < 1, (path, i, 'not portrait A4')
            assert f'Página {i} de {len(pdf.pages)}' in (page.extract_text() or ''), (path, i, 'missing footer')
            assert all(char['x0'] >= 0 and char['x1'] <= page.width + 1 and char['top'] >= 0 and char['bottom'] <= page.height for char in page.chars), (path, i, 'outside page bounds')
        if 'historico-longo' in path.name:
            for i in range(65):
                assert f'REC-{i:05d}' in text, (path, i, 'missing payment')
        print(f'Layout checked: {path} ({len(pdf.pages)} pages)')
