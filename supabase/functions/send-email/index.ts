import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface EmailPayload {
  to: string
  subject: string
  html?: string
  body?: string
  from?: string
  attachmentUrl?: string
  attachmentName?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers':
          'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const payload: EmailPayload = await req.json()

    const { to, subject, html, body, from } = payload

    if (!to || !subject || (!html && !body)) {
      return new Response(
        JSON.stringify({ error: 'Champs manquants: to, subject, html ou body' }),
        { status: 400,
          headers: { 'Content-Type': 'application/json' } }
      )
    }

    const emailFrom = from || 'notifications@97import.com'

    // Si html fourni on l'utilise, sinon on wrappe le body texte
    const htmlContent = html || `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8">
        <style>
          body { font-family: Inter, Arial, sans-serif; color: #374151; margin: 0; padding: 0; }
          .container { max-width: 560px; margin: 0 auto; padding: 32px 24px; }
          .header { background: #1E3A5F; padding: 20px 24px; border-radius: 8px 8px 0 0; }
          .header h1 { color: #fff; font-size: 18px; margin: 0; }
          .header p { color: #93C5FD; font-size: 13px; margin: 4px 0 0; }
          .body { background: #fff; border: 0.5px solid #E5E7EB; padding: 24px; border-radius: 0 0 8px 8px; }
          .btn { display: inline-block; background: #1E3A5F; color: #fff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 500; margin-top: 16px; }
          .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #9CA3AF; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>97import.com</h1>
            <p>Importation & Distribution DOM-TOM</p>
          </div>
          <div class="body">
            ${body!.split('\n').map((l: string) => `<p>${l || '&nbsp;'}</p>`).join('\n            ')}
            <a href="https://97import.com/mon-compte.html" class="btn">
              Accéder à mon espace →
            </a>
          </div>
          <div class="footer">
            97import.com — Importation DOM-TOM<br/>
            <a href="mailto:parisb2b@gmail.com" style="color:#9CA3AF;">parisb2b@gmail.com</a>
          </div>
        </div>
      </body>
      </html>
    `

    const resendPayload: Record<string, unknown> = {
      from: emailFrom,
      to: [to],
      subject,
      html: htmlContent,
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Erreur Resend:', data)
      return new Response(
        JSON.stringify({ error: data }),
        { status: response.status,
          headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )
  } catch (error) {
    console.error('Erreur:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500,
        headers: { 'Content-Type': 'application/json' } }
    )
  }
})
