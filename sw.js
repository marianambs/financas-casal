/* Service worker do Financas Casal - GERADO por fonte/build-github.sh.
   Nao edite a mao: o proximo build sobrescreve. */
const VERSAO_CACHE = '2026-08-30-17-33';
/* Corpo do service worker. O build-github.sh cola o `const VERSAO_CACHE` acima
   disto e grava o resultado em ../sw.js - NAO registre este arquivo diretamente.

   O que ele faz, em uma frase: guarda o app inteiro no aparelho, para ele abrir
   na obra sem sinal, e avisa a pagina quando existe versao nova publicada.

   O que ele NAO faz, e e' importante: nao encosta nos DADOS. O ponto, as fichas
   e os vales vivem no localStorage, que o cache do service worker nao alcanca.
   Limpar o cache aqui nunca apaga lancamento nenhum. */

const CACHE = 'bela-angra-' + VERSAO_CACHE;
const ARQUIVOS = ['./', './index.html'];

/* ---- instalar: baixa o app e guarda ---- */
self.addEventListener('install', function(ev){
  ev.waitUntil(
    caches.open(CACHE).then(function(c){
      /* reload: pula o cache HTTP, senao pode guardar a versao velha do GitHub */
      return c.addAll(ARQUIVOS.map(function(u){
        return new Request(u, {cache: 'reload'});
      }));
    })
  );
  /* de proposito NAO tem skipWaiting aqui: a versao nova fica esperando ate o
     usuario tocar em "Atualizar". Trocar o app no meio de um lancamento
     recarregaria a pagina e faria ele perder o que estava digitando. */
});

/* ---- ativar: joga fora os caches das versoes anteriores ---- */
self.addEventListener('activate', function(ev){
  ev.waitUntil(
    caches.keys().then(function(nomes){
      return Promise.all(nomes.map(function(n){
        if(n !== CACHE && n.indexOf('bela-angra-') === 0) return caches.delete(n);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

/* ---- buscar: cache primeiro ----
   O app e' um arquivo so' e ja' esta' inteiro no cache, entao servir do cache e'
   instantaneo e funciona sem sinal. A versao nova nao entra por aqui: entra pela
   troca do proprio sw.js, que so' acontece com o aval do usuario. */
self.addEventListener('fetch', function(ev){
  const req = ev.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;

  /* navegacao (abrir o app, recarregar, voltar pela Tela de Inicio) */
  if(req.mode === 'navigate'){
    ev.respondWith(
      caches.match('./index.html').then(function(hit){
        if(hit) return hit;
        return fetch(req).catch(function(){
          return new Response(
            '<meta charset="utf-8"><body style="font-family:sans-serif;padding:28px;'
          + 'line-height:1.6;color:#2b2e33;">'
          + '<h2>Sem internet e sem copia guardada</h2>'
          + '<p>Abra o app uma vez com sinal para ele ficar guardado no aparelho. '
          + 'Depois disso passa a abrir offline.</p></body>',
            {headers: {'Content-Type': 'text/html; charset=utf-8'}}
          );
        });
      })
    );
    return;
  }

  ev.respondWith(
    caches.match(req).then(function(hit){ return hit || fetch(req); })
  );
});

/* ---- o usuario tocou em "Atualizar" na barra azul ---- */
self.addEventListener('message', function(ev){
  if(ev.data && ev.data.tipo === 'ASSUMIR_AGORA') self.skipWaiting();
});
