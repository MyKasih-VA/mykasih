'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { VoiceAgentTab } from '@/components/testing/VoiceAgentTab'
import { ChatbotSimTab } from '@/components/testing/ChatbotSimTab'
import { AnamAITab } from '@/components/testing/AnamAITab'
import { useLanguage } from '@/hooks/useLanguage'
import { t } from '@/lib/translations'

export default function Page() {
  const { language } = useLanguage()

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-semibold mb-6 text-[var(--text-primary)]">
        {t('testing.title', language)}
      </h2>

      <Tabs defaultValue="voice" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="voice">
            {t('testing.tab.voiceAgent', language)}
          </TabsTrigger>
          <TabsTrigger value="chatbot">
            {t('testing.tab.kasihChatbot', language)}
          </TabsTrigger>
          <TabsTrigger value="anam">
            {t('testing.tab.anamAI', language)}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="voice">
          <VoiceAgentTab />
        </TabsContent>

        <TabsContent value="chatbot">
          <ChatbotSimTab />
        </TabsContent>

        <TabsContent value="anam">
          <AnamAITab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
