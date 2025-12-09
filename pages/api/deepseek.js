import { deepSeekQuery } from '../../lib/deepseek'

export default async function handler(req, res) {
const { text, topK } = req.body
if (!text) return res.status(400).json({ error: 'No text provided' })

const result = await deepSeekQuery({ text, topK: topK || 5 })
if (!result) return res.status(500).json({ error: 'DeepSeek query failed' })

res.status(200).json({ result })
}