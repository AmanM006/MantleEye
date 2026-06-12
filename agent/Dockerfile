FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy python code
COPY . ./agent

# Set working directory to agent where run.py lives
WORKDIR /app/agent

# Run the agent
CMD ["python", "run.py"]
