import base64, sys, os
B=os.path.dirname(os.path.abspath(__file__)); A=os.path.join(B,'..','assets')
def uri(f,m): return f'data:{m};base64,'+base64.b64encode(open(os.path.join(A,f),'rb').read()).decode()
body=open(os.path.join(B,'body.html'),encoding='utf8').read()
for k,f in {'LOGO':'logo.webp','M_FRIENDLY':'m_friendly.webp','M_STUDENT':'m_student.webp','M_STUDY':'m_study.webp','M_READER':'m_reader.webp','GAME_FARM':'juego_granja.webp'}.items():
    body=body.replace('{{'+k+'}}',uri(f,'image/webp'))
css=open(os.path.join(B,'style.css'),encoding='utf8').read()
js=open(os.path.join(B,'art.js'),encoding='utf8').read()+'\n'+open(os.path.join(B,'app.js'),encoding='utf8').read()
html=f'''<!doctype html>
<html lang="es-CO">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Trigonometría de mi territorio · MindoClass</title>
<meta name="description" content="Curso interactivo de trigonometría para grado noveno con situaciones del Eje Cafetero. Contenidos interactivos MindoClass.">
<link rel="icon" type="image/png" href="{uri('fav.png','image/png')}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
{css}
</style>
</head>
<body>
{body}
<script>
{js}
</script>
</body>
</html>
'''
out=sys.argv[1]; os.makedirs(os.path.dirname(out),exist_ok=True)
open(out,'w',encoding='utf8').write(html); print(out, len(html)//1024,'KB')
