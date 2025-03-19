FROM public.ecr.aws/lambda/python:3.9

# Copy requirements file to Lambda task root
COPY requirements.txt ${LAMBDA_TASK_ROOT}/

# Make sure NLTK is in the requirements
RUN echo "nltk==3.8.1" >> ${LAMBDA_TASK_ROOT}/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Download NLTK data to a writeable location
RUN python -m nltk.downloader -d /tmp/nltk_data punkt

# Set NLTK data path
ENV NLTK_DATA=/tmp/nltk_data

# Copy application code
COPY *.py ${LAMBDA_TASK_ROOT}/

# Set the Lambda handler
CMD [ "app.lambda_handler" ]
