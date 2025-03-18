FROM public.ecr.aws/lambda/python:3.9

# Install system dependencies for PyMuPDF
RUN yum install -y \
    gcc \
    libffi-devel \
    python3-devel \
    freetype-devel \
    libpng-devel \
    libjpeg-devel \
    && yum clean all

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy function code
COPY app.py ${LAMBDA_TASK_ROOT}

# Set the CMD to your handler
CMD [ "app.lambda_handler" ]