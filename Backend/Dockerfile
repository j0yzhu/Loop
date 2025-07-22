# Use official lightweight Python image
FROM python:3.11-slim

# Set working directory inside the container
WORKDIR /app

# Install system dependencies (for some Python packages)
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency list
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy app source code
COPY . ./Backend

# Expose port Flask will run on
# EXPOSE 5000

# Set environment variables (use .env with docker-compose)
ENV FLASK_APP=Backend.app
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_ENV=development

# Start the app
CMD ["flask", "run"]
