FROM public.ecr.aws/lambda/python:3.9

# Copy requirements file to Lambda task root
COPY requirements.txt ${LAMBDA_TASK_ROOT}/

# Install system dependencies for PyMuPDF
RUN yum update -y && \
    yum install -y gcc make zlib-devel which && \
    yum clean all

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY *.py ${LAMBDA_TASK_ROOT}/

# Set the Lambda handler
CMD [ "app.lambda_handler" ]
