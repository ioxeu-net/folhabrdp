# Folha DP BR

Plataforma web de Departamento Pessoal para escritórios contábeis e empresas.

## Arquitetura

- **Cloudflare Pages**: interface web publicada a partir da pasta `public/`.
- **Cloudflare Worker**: API em `src/index.js`.
- **Cloudflare D1**: banco relacional central, acessado exclusivamente pelo Worker.
- **Wrangler**: ferramenta de desenvolvimento, migrações e publicação do Worker.

O frontend não acessa o D1 diretamente. Toda operação com dados deverá passar pela API, com autenticação, autorização e escopo de organização verificados no servidor.

## Estrutura atual

```text
.
├── migrations/
│   └── 0001_identity_and_tenant_foundation.sql
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── src/
│   └── index.js
├── .gitignore
├── package.json
└── wrangler.toml
```

## Configuração

O arquivo `wrangler.toml` contém o binding D1 `DB` e o identificador informado para o banco do projeto. Confirme no painel Cloudflare que o nome da base é `folhabrdp` e que o identificador corresponde ao banco correto antes de executar migrações remotas.

Instale as dependências:

```bash
npm install
```

Execute o Worker localmente:

```bash
npm run dev
```

Aplique a migração no banco local:

```bash
npm run db:local
```

Depois de conferir o ambiente e fazer backup, aplique no banco remoto:

```bash
npm run db:remote
```

Publique o Worker somente depois de validar a configuração:

```bash
npm run deploy
```

## Endpoints iniciais

| Método | Caminho | Finalidade |
|---|---|---|
| GET | `/` | Identificação do serviço |
| GET | `/api/health` | Estado básico da API |
| GET | `/api/health/db` | Teste de consulta ao D1 e listagem de tabelas |

## Cloudflare Pages

Para publicar a interface por integração Git:

- Repositório: `ioxeu-net/folhabrdp`
- Branch de produção: `main`
- Diretório de saída: `public`
- Comando de build: vazio (arquivos estáticos)

A interface consulta `https://worker.folhabrdp.dev`. Esse endereço é a configuração proposta para a API e só funcionará depois que o domínio for associado ao Worker e o DNS estiver ativo. Se o domínio escolhido mudar, atualize `API_BASE` em `public/app.js` e `APP_ORIGIN` em `wrangler.toml`.

## Segurança e próximos passos

A primeira migração cria a base de organizações, usuários, vínculos, códigos de verificação, sessões e auditoria. Ela **não implementa ainda** cadastro/login, envio de e-mail, autorização por perfil ou módulos de DP.

Antes de armazenar dados reais:

1. Implementar autenticação e verificação de e-mail no servidor.
2. Aplicar isolamento por organização em toda consulta e alteração.
3. Implementar controle de acesso por função e auditoria de operações.
4. Configurar segredos e serviço de e-mail sem expor credenciais no navegador.
5. Definir política de backup, retenção, exportação e restauração testada.
6. Validar requisitos legais e operacionais aplicáveis à LGPD.

Não inserir dados pessoais reais ou documentos de trabalhadores nesta versão inicial.
