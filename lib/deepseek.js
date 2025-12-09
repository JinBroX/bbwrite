import axios from 'axios'

const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY

export async function deepSeekQuery({ text, topK = 5 }) {
try {
const response = await axios.post(`${DEEPSEEK_API_URL}/query`, {
text,
top_k: topK
}, {
headers: {
'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
'Content-Type': 'application/json'
}
})
return response.data
} catch (err) {
console.error('DeepSeek API error:', err)
return null
}
}