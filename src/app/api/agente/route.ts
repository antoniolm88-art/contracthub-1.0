// src/app/api/agente/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey === 'sk-ant-configure-aqui') {
    return NextResponse.json({
      content: '⚠️ Agente de IA não configurado. Adicione sua ANTHROPIC_API_KEY no arquivo .env.local para ativar o agente com Claude.\n\nConsulte a documentação em https://console.anthropic.com para obter sua chave.'
    })
  }

  const { messages, contrato } = await req.json()

  // Contexto do contrato para o agente
  const contratoCtx = contrato ? `
## Contrato em análise

- **Número:** ${contrato.numero}
- **Empreendimento:** ${contrato.empreendimento_nome}
- **Parte Contratada:** ${contrato.contratada_nome ?? '—'}
- **Área:** ${contrato.area}
- **Tipo:** ${contrato.tipo}
- **Status:** ${contrato.status}
- **Objeto:** ${contrato.objeto ?? '—'}
- **Assinatura:** ${contrato.data_assinatura ?? '—'}
- **Início:** ${contrato.data_inicio ?? '—'}
- **Término:** ${contrato.data_termino ?? '—'}
- **Dias para vencer:** ${contrato.dias_para_vencer ?? 'N/A'}
- **Urgência:** ${contrato.urgencia}
- **Valor Mensal:** R$ ${contrato.valor_mensal?.toLocaleString('pt-BR') ?? '—'}
- **Valor Total:** R$ ${contrato.valor_total?.toLocaleString('pt-BR') ?? '—'}
- **Índice de Reajuste:** ${contrato.indice_reajuste ?? '—'} (${contrato.periodicidade_reajuste ?? '—'})
- **Cláusula de Multa:** ${contrato.clausula_multa ?? 'Não informada'}
- **Cláusula de Rescisão:** ${contrato.clausula_rescisao ?? 'Não informada'}
- **Cláusula de Renovação:** ${contrato.clausula_renovacao ?? 'Não informada'}
- **Responsável:** ${contrato.responsavel_nome ?? '—'}
- **ABL/Localização:** ${contrato.abl_m2 ? contrato.abl_m2 + ' m²' : contrato.localizacao ?? '—'}
  `.trim() : 'Nenhum contrato específico em contexto.'

  const systemPrompt = `Você é o agente de IA do ContractHub, especializado em análise de contratos para empresas operadoras de shopping centers.

Você tem acesso ao seguinte contrato:

${contratoCtx}

## Suas capacidades
- Analisar e resumir contratos
- Identificar riscos, cláusulas atípicas ou desfavoráveis
- Explicar cláusulas em linguagem simples
- Alertar sobre prazos críticos e obrigações
- Comparar condições com práticas de mercado
- Sugerir pontos de atenção para negociação

## Diretrizes
- Responda em português do Brasil
- Seja objetivo e direto, use formatação quando ajudar a clareza
- Sempre destaque riscos importantes com ⚠️
- Se não tiver informação suficiente para responder, diga isso claramente
- Não invente dados que não estão no contrato fornecido
- Use linguagem acessível, sem juridiquês desnecessário`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    })

    const content = response.content[0].type === 'text' ? response.content[0].text : 'Não foi possível gerar uma resposta.'
    return NextResponse.json({ content })
  } catch (error: any) {
    console.error('Anthropic API error:', error)
    return NextResponse.json({
      content: `⚠️ Erro ao conectar com o agente de IA: ${error.message}. Verifique se a ANTHROPIC_API_KEY está configurada corretamente.`
    }, { status: 500 })
  }
}
