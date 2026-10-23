from starlette.middleware.cors import CORSMiddleware
from mcp.server.mcpserver import MCPServer
import uvicorn

# Initialize the MCP Server (formerly FastMCP)
mcp = MCPServer("AlexaPlusAgent")

# Define a tool for your agent to use
@mcp.tool()
def check_system_status(service_name: str) -> str:
    """Check the status of a specific system service."""
    mock_db = {"database": "online", "iot_gateway": "offline"}
    return f"Status of {service_name}: {mock_db.get(service_name.lower(), 'unknown')}"

if __name__ == "__main__":
    # 1. Generate the Starlette app from the MCP server
    app = mcp.sse_app()
    
    # 2. Add the CORS middleware to allow the React frontend to connect
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"], 
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # 3. Run the server
    uvicorn.run(app, host="0.0.0.0", port=5000)