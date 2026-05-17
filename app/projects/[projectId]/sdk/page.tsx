"use client";

import { use, useState } from "react";
import useSWR from "swr";
import { Copy, Check, Code, Terminal, Globe, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { PageHeader } from "@/components/layout/page-header";
import { useToast } from "@/components/ui/use-toast";
import { fetcher, API_BASE_URL, type Environment, type Project } from "@/lib/api";

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copied!",
      description: label ? `${label} copied to clipboard` : "Copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 absolute top-2 right-2"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}

function CodeBlock({
  code,
  language,
  label,
}: {
  code: string;
  language: string;
  label?: string;
}) {
  return (
    <div className="relative">
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <CopyButton text={code} label={label} />
    </div>
  );
}

export default function SDKPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { toast } = useToast();

  const { data: project } = useSWR<Project>(
    `/v1/projects/${projectId}`,
    fetcher
  );
  const { data: environments } = useSWR<Environment[]>(
    `/v1/projects/${projectId}/environments`,
    fetcher
  );

  const [selectedEnvId, setSelectedEnvId] = useState<string>("");

  // Set default environment
  if (environments?.length && !selectedEnvId) {
    setSelectedEnvId(environments[0].id);
  }

  const selectedEnv = environments?.find((e) => e.id === selectedEnvId);
  const apiKey = selectedEnv?.apiKey || "YOUR_API_KEY";

  const copyApiKey = async () => {
    if (!selectedEnv?.apiKey) return;
    await navigator.clipboard.writeText(selectedEnv.apiKey);
    toast({
      title: "API Key copied!",
      description: "SDK API key has been copied to clipboard",
    });
  };

  const jsInstall = `npm install @flagship/js-sdk
# or
yarn add @flagship/js-sdk`;

  const jsUsage = `import { FlagshipClient } from '@flagship/js-sdk';

// Initialize the client
const client = new FlagshipClient({
  apiKey: '${apiKey}',
  baseUrl: '${API_BASE_URL}',
});

await client.initialize();

// Define your user context
const user = {
  key: 'user-123',
  attributes: {
    email: 'user@example.com',
    plan: 'premium',
    country: 'US',
  },
};

// Check if a feature flag is enabled
const isEnabled = client.isEnabled('my-feature-flag', user);

if (isEnabled) {
  // Show new feature
  console.log('Feature is enabled!');
} else {
  // Show fallback
  console.log('Feature is disabled');
}

// Get a flag variation value
const variation = client.getVariation('my-feature-flag', user, 'default-value');
console.log('Variation:', variation);`;

  const reactUsage = `import { FlagshipProvider, useFlagship } from '@flagship/react-sdk';

// Wrap your app with the provider
function App() {
  return (
    <FlagshipProvider
      apiKey="${apiKey}"
      baseUrl="${API_BASE_URL}"
      user={{
        key: 'user-123',
        attributes: { plan: 'premium' },
      }}
    >
      <MyComponent />
    </FlagshipProvider>
  );
}

// Use the hook in your components
function MyComponent() {
  const { isEnabled, getVariation, isLoading } = useFlagship();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const showNewFeature = isEnabled('my-feature-flag');
  const buttonColor = getVariation('button-color', 'blue');

  return (
    <div>
      {showNewFeature ? (
        <NewFeature color={buttonColor} />
      ) : (
        <OldFeature />
      )}
    </div>
  );
}`;

  const nodeUsage = `const { FlagshipClient } = require('@flagship/node-sdk');

// Initialize the client
const client = new FlagshipClient({
  apiKey: '${apiKey}',
  baseUrl: '${API_BASE_URL}',
});

await client.initialize();

// In your API handler
app.get('/api/feature', async (req, res) => {
  const user = {
    key: req.user.id,
    attributes: {
      email: req.user.email,
      plan: req.user.plan,
    },
  };

  const isEnabled = client.isEnabled('my-feature-flag', user);
  
  res.json({ featureEnabled: isEnabled });
});`;

  const curlUsage = `# Get SDK configuration
curl -X GET '${API_BASE_URL}/v1/sdk/config' \\
  -H 'X-API-Key: ${apiKey}'

# Evaluate a flag
curl -X POST '${API_BASE_URL}/v1/sdk/evaluate' \\
  -H 'X-API-Key: ${apiKey}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "flagKey": "my-feature-flag",
    "user": {
      "key": "user-123",
      "attributes": {
        "email": "user@example.com",
        "plan": "premium"
      }
    }
  }'

# Track an event
curl -X POST '${API_BASE_URL}/v1/sdk/track' \\
  -H 'X-API-Key: ${apiKey}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "eventType": "conversion",
    "user": {
      "key": "user-123"
    },
    "flagKey": "my-feature-flag",
    "variationKey": "treatment"
  }'`;

  const sseUsage = `// Subscribe to real-time flag updates
const eventSource = new EventSource(
  '${API_BASE_URL}/v1/sdk/stream?apiKey=${apiKey}'
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Flag update received:', data);
  
  // Update your local flag cache
  updateFlagCache(data);
};

eventSource.onerror = (error) => {
  console.error('SSE connection error:', error);
  // Implement reconnection logic
};`;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="SDK Integration"
        description="Integrate Flagship into your application"
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: project?.name || "Project", href: `/projects/${projectId}` },
          { label: "SDK" },
        ]}
        actions={
          <Select value={selectedEnvId} onValueChange={setSelectedEnvId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select environment" />
            </SelectTrigger>
            <SelectContent>
              {environments?.map((env) => (
                <SelectItem key={env.id} value={env.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: env.color || "#6366f1" }}
                    />
                    {env.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="flex-1 p-6 overflow-auto">

        {/* API Key Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">SDK API Key</CardTitle>
            <CardDescription>
              Use this key to authenticate your SDK requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <code className="flex-1 bg-muted px-4 py-3 rounded-lg font-mono text-sm">
                {apiKey}
              </code>
              <Button onClick={copyApiKey}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Key
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              <strong>Note:</strong> Keep this key secure. Do not expose it in
              client-side code for production environments.
            </p>
          </CardContent>
        </Card>

        {/* SDK Tabs */}
        <Tabs defaultValue="javascript" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="javascript">
              <Code className="mr-2 h-4 w-4" />
              JavaScript
            </TabsTrigger>
            <TabsTrigger value="react">
              <Globe className="mr-2 h-4 w-4" />
              React
            </TabsTrigger>
            <TabsTrigger value="node">
              <Terminal className="mr-2 h-4 w-4" />
              Node.js
            </TabsTrigger>
            <TabsTrigger value="api">
              <Zap className="mr-2 h-4 w-4" />
              REST API
            </TabsTrigger>
            <TabsTrigger value="sse">
              <Zap className="mr-2 h-4 w-4" />
              Real-time
            </TabsTrigger>
          </TabsList>

          <TabsContent value="javascript">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  JavaScript SDK
                  <Badge variant="secondary">Browser & Node.js</Badge>
                </CardTitle>
                <CardDescription>
                  Universal JavaScript SDK for browser and server environments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Installation</h4>
                  <CodeBlock
                    code={jsInstall}
                    language="bash"
                    label="Install command"
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-3">Usage</h4>
                  <CodeBlock
                    code={jsUsage}
                    language="javascript"
                    label="JavaScript code"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="react">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  React SDK
                  <Badge variant="secondary">React 18+</Badge>
                </CardTitle>
                <CardDescription>
                  React hooks and components for feature flags
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Installation</h4>
                  <CodeBlock
                    code="npm install @flagship/react-sdk"
                    language="bash"
                    label="Install command"
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-3">Usage</h4>
                  <CodeBlock
                    code={reactUsage}
                    language="jsx"
                    label="React code"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="node">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Node.js SDK
                  <Badge variant="secondary">Server-side</Badge>
                </CardTitle>
                <CardDescription>
                  Server-side SDK for Node.js applications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Installation</h4>
                  <CodeBlock
                    code="npm install @flagship/node-sdk"
                    language="bash"
                    label="Install command"
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-3">Usage</h4>
                  <CodeBlock
                    code={nodeUsage}
                    language="javascript"
                    label="Node.js code"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  REST API
                  <Badge variant="secondary">HTTP</Badge>
                </CardTitle>
                <CardDescription>
                  Direct API access for any language or platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">cURL Examples</h4>
                  <CodeBlock
                    code={curlUsage}
                    language="bash"
                    label="cURL commands"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sse">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Real-time Updates
                  <Badge variant="secondary">Server-Sent Events</Badge>
                </CardTitle>
                <CardDescription>
                  Subscribe to real-time flag updates via SSE
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">SSE Connection</h4>
                  <CodeBlock
                    code={sseUsage}
                    language="javascript"
                    label="SSE code"
                  />
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Benefits of Real-time Updates</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Instant flag changes without polling</li>
                    <li>• Reduced API calls and bandwidth</li>
                    <li>• Better user experience with immediate updates</li>
                    <li>• Automatic reconnection on connection loss</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
