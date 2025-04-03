FROM public.ecr.aws/lambda/python:3.9

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install -r requirements.txt

# Download NLTK data during build
RUN python -m nltk.downloader -d /var/task/nltk_data punkt

# Copy application code
COPY app.py .

# Set command for Lambda
CMD ["app.lambda_handler"] 
