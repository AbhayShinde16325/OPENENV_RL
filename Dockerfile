# Setup the Dockerfile for HF Spaces
# We need to serve the React frontend (via Node/static) and the FastAPI backend

FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

FROM python:3.10-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY app/ ./app
COPY .env.example .env
COPY openenv.yaml .
COPY baseline_openai.py .

# Copy built frontend assets to a directory FastAPI can serve
COPY --from=frontend-build /app/frontend/dist ./static

# Expose HF Spaces default port
EXPOSE 7860

# Run the application
# We use uvicorn to run the app; FastAPI will be modified to serve the static folder
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
