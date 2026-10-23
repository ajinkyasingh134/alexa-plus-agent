import { useState, useEffect, useRef } from 'react'
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import './App.css'

function App() {
  const [mcpClient, setMcpClient] = useState(null);
  const [status, setStatus] = useState("Disconnected");
  const [messages, setMessages] = useState([
    { role: 'agent', text: "Hello! I am your Alexa+ Agent. How can I help you manage your systems today?" }
  ]);
  const [inputText, setInputText] = useState("");
  const chatRef = useRef(null);

  useEffect(() => {
    async function connectMCP() {
      try {
        setStatus("Connecting...");
        const transport = new SSEClientTransport(new URL("http://localhost:5000/sse"));
        const client = new Client(
          { name: "AlexaPlusReactSimulator", version: "1.0.0" },
          { capabilities: {} }
        );
        
        await client.connect(transport);
        setMcpClient(client);
        setStatus("Connected");
      } catch (error) {
        console.error("Connection failed:", error);
        setStatus("Disconnected");
      }
    }
    connectMCP();
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !mcpClient) return;

    const userMessage = inputText;
    setInputText("");
    
    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setMessages(prev => [...prev, { role: 'agent', text: "Thinking..." }]);

    try {
      // ---------------------------------------------------------
      // MOCK AGENT REASONING LOOP (Since we don't have an LLM API key configured yet)
      // In a production app, the user text goes to an LLM, which returns a Tool Call.
      // ---------------------------------------------------------
      let finalAgentResponse = "";

      if (userMessage.toLowerCase().includes("iot")) {
        // The Agent decides to call the MCP Tool
        const result = await mcpClient.callTool({
          name: "check_system_status",
          arguments: { service_name: "iot_gateway" }
        });
        
        // The Agent formats the tool output for the user
        finalAgentResponse = `I checked the MCP server. ${result.content[0].text}`;
      } else {
        finalAgentResponse = "I can only check the IoT gateway right now. Try asking 'Check the IoT gateway'.";
      }

      // Update the UI with the final response
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { role: 'agent', text: finalAgentResponse };
        return newMsgs;
      });

    } catch (error) {
      console.error(error);
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { role: 'agent', text: "Error executing MCP tool." };
        return newMsgs;
      });
    }
  };

  return (
    <div className="app-container">
      <h1>Alexa+ Agent Simulator</h1>
      <div style={{textAlign: 'center'}}>
        <span className={`status-badge ${status.toLowerCase()}`}>
          {status}
        </span>
      </div>
      
      <div className="chat-window" ref={chatRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            {msg.text}
          </div>
        ))}
      </div>

      <form className="input-area" onSubmit={handleSendMessage}>
        <input 
          type="text" 
          placeholder='Type a command like "Check the IoT gateway"...'
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={status !== "Connected"}
        />
        <button type="submit" disabled={status !== "Connected" || !inputText.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}

export default App