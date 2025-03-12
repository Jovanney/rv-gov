INSERT INTO obras (
  idUnico, nome, uf, endereco, descricao, funcaoSocial, metaGlobal,
  dataInicialPrevista, dataInicialEfetiva, dataFinalPrevista, dataFinalEfetiva,
  especie, natureza, situacao, dataSituacao, geometria, cep, enderecoAreaExecutora,
  recursosOrigem, recursosValorInvestimento
) VALUES 
(
  'OBR001', 'Construção de Escola', 'SP', 'Rua das Flores, 123, São Paulo',
  'Escola pública para ensino fundamental', 'Educação Infantil',
  'Atender 500 alunos', '2024-01-10', '2024-01-15', '2025-12-31', NULL,
  'Infraestrutura', 'Pública', 'Em andamento', '2024-02-20',
  'POINT(-46.633308 -23.550520)', '01000-000', 'Secretaria de Educação - SP',
  'Governo Federal', 1500000.00
)