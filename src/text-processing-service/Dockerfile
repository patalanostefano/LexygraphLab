FROM public.ecr.aws/lambda/python:3.9

# Copy requirements file to Lambda task root
COPY requirements.txt ${LAMBDA_TASK_ROOT}/

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Download NLTK data to a writeable location
RUN python -m nltk.downloader -d /tmp/nltk_data punkt

# Set NLTK data path
ENV NLTK_DATA=/tmp/nltk_data

# Install spaCy model
RUN python -m spacy download en_core_web_sm

# Copy application code
COPY *.py ${LAMBDA_TASK_ROOT}/

# Set the Lambda handler
CMD [ "app.lambda_handler" ]
