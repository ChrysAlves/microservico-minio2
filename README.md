# Microsserviço MinIO - Sistema de Preservação Digital

## 📋 Visão Geral

O **Microsserviço MinIO** é o "**Armazém Digital**" do sistema de preservação digital. Sua única responsabilidade é gerenciar operações de armazenamento de arquivos no MinIO (upload e geração de URLs pré-assinadas). Ele atua como uma camada de abstração segura entre o sistema de preservação e o storage físico.

### 🎯 Função Principal
- **Upload**: Armazenar arquivos (SIPs originais e AIPs processados) no MinIO
- **Generate URL**: Gerar URLs pré-assinadas temporárias para download seguro
- **Gestão de Buckets**: Criar e gerenciar buckets automaticamente

## 🏗️ Arquitetura e Comunicação

### Posição na Arquitetura
```
Front-End → Middleware → Mapoteca → MinIO (ESTE SERVIÇO)
                    ↗
              Gestão de Dados
```

### 🔒 Restrições de Segurança
**IMPORTANTE**: Este microsserviço possui uma restrição arquitetural crítica:

- ✅ **APENAS** o **Microsserviço Mapoteca** pode se comunicar diretamente com ele
- ❌ **NENHUM** outro microsserviço (Processamento, Gestão de Dados, Acesso) pode chamá-lo diretamente
- 🎯 **Objetivo**: Centralizar todo controle de armazenamento no Mapoteca, garantindo segurança e auditoria

### Comunicação
- **Protocolo**: API REST (HTTP)
- **Porta**: 3003 (configurável via `PORT`)
- **Origem Permitida**: Apenas Microsserviço Mapoteca

## 🔄 Fluxos de Operação

### 1. Upload (Ingestão)
```
Mapoteca → MinIO: POST /storage/upload
         ← Confirmação: { path, etag }
```
**Quando**: Após o Microsserviço de Processamento criar o AIP e notificar o Mapoteca

### 2. Download (Acesso via URL Pré-assinada)
```
Mapoteca → MinIO: POST /storage/generate-url
         ← URL temporária (15 min)
Usuário → MinIO: GET {url_temporaria}
        ← Stream do arquivo
```
**Quando**: Usuário solicita download via Front-End → Mapoteca → URL temporária

## 🗂️ Estrutura de Buckets

O serviço gerencia automaticamente dois buckets principais:

### `originals`
- **Conteúdo**: SIPs (Submission Information Packages) originais
- **Estrutura**: `originals/{id}/{arquivo}`
- **Uso**: Armazenamento temporário durante processamento

### `preservation`
- **Conteúdo**: AIPs (Archival Information Packages) finais
- **Estrutura**: `preservation/{id}/{arquivo}`
- **Uso**: Armazenamento permanente para preservação

## 🚀 Configuração e Execução

### Variáveis de Ambiente
```env
# Configuração do MinIO (Interno)
S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

# URL Pública do MinIO (para URLs pré-assinadas)
MINIO_PUBLIC_URL=http://localhost:9000

# Configuração do Serviço
PORT=3003
```

**Importante**: 
- `S3_ENDPOINT`: URL interna para comunicação entre containers
- `MINIO_PUBLIC_URL`: URL pública acessível pelo navegador do usuário



## 📡 API Endpoints

### POST /storage/upload
Faz upload de um arquivo para o MinIO.

**Parâmetros**:
- `file`: Arquivo (multipart/form-data)
- `bucket`: Nome do bucket (`originals` ou `preservation`)
- `key`: Caminho/chave do arquivo (ex: `{id}/documento.pdf`)

**Resposta**:
```json
{
  "path": "preservation/uuid-123/documento.pdf",
  "etag": "d41d8cd98f00b204e9800998ecf8427e"
}
```

**Limites**:
- Tamanho máximo: 100MB por arquivo (configurado no código)  *temos que mudar
 esta no :

 
  @UploadedFile(
            new ParseFilePipe({
                validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 100 })],
            }),   
Storage.controller



- Formatos: Todos os tipos de arquivo

### POST /storage/generate-url
Gera uma URL pré-assinada temporária para download seguro.

**Parâmetros**:
```json
{
  "bucket": "preservation",
  "path": "uuid-123/documento.pdf"
}
```

**Resposta**:
```json
{
  "url": "http://minio:9000/preservation/uuid-123/documento.pdf?X-Amz-Algorithm=..."
}
```

**Características**:
- URL válida por 15 minutos (900 segundos)
- Download direto do MinIO (sem passar pelo microsserviço)
- Força download como anexo (`attachment`)

## 🔧 Tecnologias

- **Framework**: NestJS (TypeScript)
- **Arquitetura**: Clean Architecture (Domain/Infra/Use Cases)
- **Storage**: MinIO (compatível com S3)
- **SDK**: AWS SDK v3 para S3
- **Upload**: Multer para processamento de arquivos
- **Validação**: Class-validator para DTOs
- **URLs Pré-assinadas**: AWS S3 Request Presigner

## 🏛️ Contexto no Sistema de Preservação Digital

### Papel na "Fábrica Digital"
O Microsserviço MinIO é o **"Armazém Automatizado"** da fábrica de preservação digital:

1. **Recebe "caixas" (arquivos)** do Mapoteca para armazenamento
2. **Organiza fisicamente** os arquivos em buckets estruturados
3. **Entrega "caixas"** quando solicitado pelo Mapoteca
4. **Remove "caixas"** quando não são mais necessárias

### Integração com Outros Microsserviços

#### 🔗 Mapoteca (Gerente Central)
- **Relação**: Cliente direto e único
- **Comunicação**: API REST síncrona
- **Operações**: Upload de arquivos e geração de URLs
- **Fluxo**: Mapoteca orquestra todas as operações de storage

#### 🚫 Outros Microsserviços
- **Processamento**: Não acessa diretamente (via Mapoteca)
- **Gestão de Dados**: Não acessa diretamente (via Mapoteca)  
- **Acesso**: Não acessa diretamente (via Mapoteca)
- **Ingestão**: Não acessa diretamente (via Mapoteca)

#### 🌐 Usuários Finais
- **Acesso**: Via URLs pré-assinadas temporárias
- **Segurança**: URLs expiram em 15 minutos
- **Performance**: Download direto do MinIO (sem proxy)

## 🔍 Monitoramento e Logs

### Logs Principais
- ✅ Upload bem-sucedido: `Arquivo salvo com sucesso em: {path}`
- ❌ Falha no upload: `Falha no upload para o MinIO: {error}`
- 🔧 Criação de bucket: `Bucket [{name}] criado com sucesso`

### Métricas Importantes
- Número de uploads por minuto
- Tamanho total de arquivos armazenados
- Taxa de sucesso/falha nas operações
- Tempo de resposta das operações

## 🛡️ Segurança

### Controle de Acesso
- Apenas Mapoteca pode acessar os endpoints
- Autenticação via credenciais MinIO configuradas
- Buckets isolados por tipo de conteúdo

### Validações
- Limite de tamanho de arquivo (100MB configurado no controller)
- Validação de tipos MIME automática
- Verificação de integridade via ETags
- Validação de DTOs com class-validator
- URLs pré-assinadas com expiração automática

## 📈 Escalabilidade

### Características
- **Stateless**: Não mantém estado entre requisições
- **Horizontal**: Pode ser replicado conforme demanda
- **Storage**: MinIO suporta clustering para alta disponibilidade

### Considerações de Performance
- URLs pré-assinadas eliminam proxy de download
- Upload direto via buffer em memória
- Operações assíncronas em todos os use cases
- Buckets criados automaticamente na inicialização
- Logs estruturados para monitoramento

---

