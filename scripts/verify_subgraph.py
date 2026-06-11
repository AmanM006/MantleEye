import asyncio
import httpx

SUBGRAPH_URL = "https://api.goldsky.com/api/public/project_cl8ylkiw00krx0hvza0qw17vn/subgraphs/blocks/mantle/gn"

_RECENT_BLOCKS_QUERY = """
query RecentBlocks($first: Int!) {
  blocks(first: $first, orderBy: number, orderDirection: desc) {
    id
    number
    timestamp
  }
}
"""

async def main():
    print(f"Connecting to Mantle Blocks Subgraph: {SUBGRAPH_URL}")
    async with httpx.AsyncClient() as client:
        payload = {"query": _RECENT_BLOCKS_QUERY, "variables": {"first": 5}}
        try:
            response = await client.post(SUBGRAPH_URL, json=payload, timeout=15.0)
            print(f"HTTP Status: {response.status_code}")
            data = response.json()
            if "errors" in data:
                print("GraphQL errors:", data["errors"])
            else:
                blocks = data.get("data", {}).get("blocks", [])
                print(f"Successfully retrieved {len(blocks)} blocks from Mantle Network:")
                for block in blocks:
                    print(f" - Block #{block['number']} | Timestamp: {block['timestamp']}")
        except Exception as e:
            print("Failed to query subgraph:", e)

if __name__ == "__main__":
    asyncio.run(main())
