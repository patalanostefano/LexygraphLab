FROM public.ecr.aws/lambda/nodejs:16

# Copy the GoTrue binary and all necessary files
COPY ./259ed54420a1f94ce525465ef73a3e78ddbdcb806e509507b5d62ba592702c09/usr/local/bin/gotrue ${LAMBDA_TASK_ROOT}/
COPY ./259ed54420a1f94ce525465ef73a3e78ddbdcb806e509507b5d62ba592702c09/usr/local/etc/auth ${LAMBDA_TASK_ROOT}/auth/

# Make the GoTrue binary executable
RUN chmod +x ${LAMBDA_TASK_ROOT}/gotrue

# Set up the Lambda adapter script
COPY lambda.js ${LAMBDA_TASK_ROOT}/

CMD [ "lambda.js" ]
