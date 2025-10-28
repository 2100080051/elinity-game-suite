import { NextResponse } from 'next/server'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

function cleanJSONString(str) {
  if (typeof str !== 'string') return str
  // Strip code fences and surrounding text, try to find first {}
  const fence = str.replace(/^```(json)?/gi, '').replace(/```$/g, '').trim()
  const firstBrace = fence.indexOf('{')
  const lastBrace = fence.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return fence.slice(firstBrace, lastBrace + 1)
  }
  return fence
}

function safeParseJSON(str, fallback = {}) {
  try {
    return JSON.parse(cleanJSONString(str))
  } catch (e) {
    return fallback
  }
}

async function callOpenRouter(messages, schemaHint) {
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'
  const key = process.env.OPENROUTER_API_KEY
  if (!key) {
    // Dev fallback
    return {
      choices: [{ message: { content: JSON.stringify({ ok: true, fallback: true, ...schemaHint }) } }]
    }
  }
  const headers = {
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3028',
    'X-Title': 'Life Swap Simulator'
  }
  const body = {
    model,
    messages,
    response_format: { type: 'json_object' },
    temperature: 0.9
  }
  const res = await fetch(OPENROUTER_URL, { method: 'POST', headers, body: JSON.stringify(body) })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text)
  }
  return res.json()
}

function systemPrompt() {
  return `You are the "Life Architect" for a game called Life Swap Simulator.
Always respond with strict JSON (no code fences), matching the requested schema.
Tone: warm, imaginative, grounded in reality but playful. Keep responses concise.
`
}

function buildMessages(action, payload) {
  const sys = { role: 'system', content: systemPrompt() }
  const user = { role: 'user', content: JSON.stringify({ action, payload }) }
  return [sys, user]
}

function fallbackLife() {
  return {
    title: 'Street Food Documentarian in Hanoi',
    backstory: 'You left a corporate job to film hidden street food legends on a tiny budget. Your moped is your studio.',
    traits: ['curious', 'resourceful', 'empathetic']
  }
}

function scoreFrom(text) {
  // Simple heuristic fallback if AI not available
  const len = (text || '').length
  const creativity = Math.min(10, 3 + len / 80)
  const realism = Math.min(10, 4 + len / 100)
  const empathy = Math.min(10, 3 + (text.match(/feel|care|help|support|listen/gi) || []).length)
  const total = Math.round((creativity + realism + empathy) * 3.3)
  return { creativity, realism, empathy, total }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { action, payload } = req.body || {}

  try {
    if (action === 'assign') {
      const schema = { life: fallbackLife(), narrative: 'Intro narration' }
      const or = await callOpenRouter(buildMessages('assign', payload), schema)
      const content = or?.choices?.[0]?.message?.content || JSON.stringify(schema)
      const data = safeParseJSON(content, schema)
      if (!data.life) data.life = fallbackLife()
      return res.status(200).json({ life: data.life, narrative: data.narrative || null })
    }

    if (action === 'scenario') {
      const schema = { narrative: 'You face a moment...' }
      const or = await callOpenRouter(buildMessages('scenario', payload), schema)
      const content = or?.choices?.[0]?.message?.content || JSON.stringify(schema)
      const data = safeParseJSON(content, schema)
      return res.status(200).json({ narrative: data.narrative || schema.narrative })
    }

    if (action === 'react') {
      const base = { narrative: 'The world responds...', score: scoreFrom(payload?.response) }
      const or = await callOpenRouter(buildMessages('react', payload), base)
      const content = or?.choices?.[0]?.message?.content || JSON.stringify(base)
      const data = safeParseJSON(content, base)
      if (!data.score) data.score = base.score
      return res.status(200).json({ narrative: data.narrative || base.narrative, score: data.score })
    }

    if (action === 'summary') {
      const schema = { summary: 'A short reflective summary.' }
      const or = await callOpenRouter(buildMessages('summary', payload), schema)
      const content = or?.choices?.[0]?.message?.content || JSON.stringify(schema)
      const data = safeParseJSON(content, schema)
      return res.status(200).json({ summary: data.summary || schema.summary })
    }

    return res.status(400).json({ error: 'Unknown action' })
  } catch (e) {
    console.error('life api error', e)
    return res.status(200).json({
      error: 'AI unavailable, using fallback',
      life: fallbackLife(),
      narrative: 'The world continues without AI for now.'
    })
  }
}
