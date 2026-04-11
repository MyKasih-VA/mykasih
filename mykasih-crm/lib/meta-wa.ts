const META_API_BASE = 'https://graph.facebook.com/v20.0'

export async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID
  const token = process.env.META_WA_ACCESS_TOKEN

  if (!phoneNumberId || !token) {
    console.log(`[WA STUB] To: ${to} | Message: ${text}`)
    return
  }

  const response = await fetch(`${META_API_BASE}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  })

  if (!response.ok) {
    console.error(`[WA] Send failed: ${response.status} ${await response.text()}`)
  }
}

export async function sendWhatsAppButtons(
  to: string,
  bodyText: string,
  items: Array<{ id: string; title: string; description?: string }>
): Promise<void> {
  const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID
  const token = process.env.META_WA_ACCESS_TOKEN

  if (!phoneNumberId || !token) {
    console.log(`[WA STUB] To: ${to} | List: ${items.map(i => i.title).join(', ')}`)
    return
  }

  const response = await fetch(`${META_API_BASE}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',       // NOT "button" — button max 3 items, list supports 10
        body: { text: bodyText },
        action: {
          button: 'Pilih / Select',
          sections: [
            {
              title: 'Pilih perkhidmatan',
              rows: items.map(item => ({
                id: item.id,
                title: item.title,
                description: item.description ?? '',
              })),
            },
          ],
        },
      },
    }),
  })

  if (!response.ok) {
    console.error(`[WA] List send failed: ${response.status} ${await response.text()}`)
  }
}
