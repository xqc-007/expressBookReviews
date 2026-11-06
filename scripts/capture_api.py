from pathlib import Path
import subprocess, shlex
root=Path(__file__).resolve().parents[1]
evidence=root/'evidence';evidence.mkdir(exist_ok=True)
def capture(name,commands):
 text=''
 for args in commands:
  r=subprocess.run(args,capture_output=True,text=True,check=True)
  text+='$ '+shlex.join(args)+'\n'+r.stdout+'\n\n'
 (evidence/name).write_text(text)
 return text
c=['curl','-sS','--fail-with-body'];b='http://127.0.0.1:5000'
capture('getallbooks',[c+[b+'/']])
capture('getbooksbyISBN',[c+[b+'/isbn/1']])
capture('getbooksbyauthor',[c+['--get',b+'/author/Unknown']])
capture('getbooksbytitle',[c+[b+'/title/Things%20Fall%20Apart']])
capture('getbookreview',[c+[b+'/review/1']])
capture('register',[c+['-X','POST',b+'/register','-H','Content-Type: application/json','-d','{"username":"kyrin_demo","password":"DemoPass2026!"}']])
capture('login',[c+['-X','POST',b+'/customer/login','-H','Content-Type: application/json','-d','{"username":"kyrin_demo","password":"DemoPass2026!"}','-c','/tmp/bookstore-cookies.txt']])
capture('reviewadded',[
 c+['-X','PUT',b+'/customer/auth/review/1','-b','/tmp/bookstore-cookies.txt','-H','Content-Type: application/json','-d','{"review":"A compelling story with memorable characters."}'],
 c+['-X','PUT',b+'/customer/auth/review/1','-b','/tmp/bookstore-cookies.txt','-H','Content-Type: application/json','-d','{"review":"A powerful novel exploring tradition and change."}'],
 c+[b+'/review/1']])
capture('deletereview',[c+['-X','DELETE',b+'/customer/auth/review/1','-b','/tmp/bookstore-cookies.txt'],c+[b+'/review/1']])
questions=[('getallbooks',2),('getbooksbyISBN',3),('getbooksbyauthor',4),('getbooksbytitle',5),('getbookreview',6),('register',7),('login',8),('reviewadded',9),('deletereview',10)]
text='# Book Review Application — Submission Answers\n\n'
if (evidence/'githubrepo').exists():
 text+='## Question 1\n\n```text\n'+(evidence/'githubrepo').read_text().strip()+'\n```\n\n'
else:
 text+='## Question 1\n\nRun `python3 scripts/capture_githubrepo.py xqc-007`, then paste `evidence/githubrepo`.\n\n'
for name,num in questions:
 text+=f'## Question {num}\n\n```text\n{(evidence/name).read_text().strip()}\n```\n\n'
text+='## Question 11\n\nhttps://github.com/xqc-007/expressBookReviews/blob/main/final_project/router/general.js\n'
(root/'submission_answers.md').write_text(text)
print('Captured nine evidence files with real cURL responses.')
