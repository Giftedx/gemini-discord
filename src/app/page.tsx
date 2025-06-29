import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Webhook, Combine, MessageSquareQuote, KeyRound, Github, Search, MessageSquareText, Cpu } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: <Webhook className="w-8 h-8 text-primary" />,
      title: "Discord API Integration & Command Handler",
      description: "Listens for Discord webhook events, parses commands, and routes them to appropriate handlers.",
    },
    {
      icon: <Combine className="w-8 h-8 text-primary" />,
      title: "Multimodal Content Processing Service",
      description: "Receives file uploads from Discord, processes content, and passes it to Gemini for analysis.",
    },
    {
      icon: <MessageSquareQuote className="w-8 h-8 text-primary" />,
      title: "Persistent Conversation Context Management",
      description: "Stores and retrieves conversation histories by Discord thread ID to maintain context.",
    },
    {
      icon: <KeyRound className="w-8 h-8 text-primary" />,
      title: "Secure User-Specific Credential Management",
      description: "Securely stores encrypted Gemini API keys for user-specific requests.",
    },
    {
      icon: <Github className="w-8 h-8 text-primary" />,
      title: "Workflow & GitHub Integration Service",
      description: "Connects to the GitHub API to monitor repositories and execute predefined automated tasks.",
    },
    {
      icon: <Search className="w-8 h-8 text-primary" />,
      title: "Web Search Tool Integration",
      description: "Allows the Gemini model to perform real-time web searches to answer user queries accurately.",
    },
    {
      icon: <MessageSquareText className="w-8 h-8 text-primary" />,
      title: "Discord Conversation Summarization",
      description: "Summarizes long Discord threads using GenAI to quickly catch up on the discussion.",
    },
     {
      icon: <Cpu className="w-8 h-8 text-primary" />,
      title: "GenAI Powered Backend",
      description: "Leverages Genkit and Google's Gemini models to power intelligent features.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex-grow container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
            <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                <span className="text-primary">Gemini</span> Collaborative Suite for Discord
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg leading-8 text-muted-foreground">
                A powerful backend leveraging Google's Gemini AI to supercharge your Discord server with intelligent, collaborative features.
            </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((feature, index) => (
            <Card key={index} className="flex flex-col items-center text-center p-6 bg-card rounded-xl shadow-sm hover:shadow-primary/20 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="bg-primary/10 rounded-full p-3 mb-4 inline-flex">
                {feature.icon}
              </div>
              <CardHeader className="p-0">
                <CardTitle className="font-headline text-lg font-semibold">{feature.title}</CardTitle>
              </CardHeader>
              <CardDescription className="mt-2 text-base flex-grow">
                {feature.description}
              </CardDescription>
            </Card>
          ))}
        </div>
      </main>
      <footer className="text-center py-8 text-muted-foreground border-t">
        <p>&copy; {new Date().getFullYear()} Gemini Collaborative Suite. All rights reserved.</p>
      </footer>
    </div>
  );
}
