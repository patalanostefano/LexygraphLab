#!/bin/bash

# Add loggers to all classes that use 'log'
for file in $(grep -l "log\." src/main/java/com/docprocessing/document/*/*.java); do
  echo "Adding logger to $file"
  
  # Insert import statements at the beginning
  sed -i '' '1s/^/import org.slf4j.Logger;\nimport org.slf4j.LoggerFactory;\n/' "$file"
  
  # Get class name from file name
  class_name=$(basename "$file" .java)
  
  # Add logger declaration after the class declaration
  sed -i '' "/^public class $class_name/a\\
    private static final Logger log = LoggerFactory.getLogger($class_name.class);" "$file"
done

echo "Loggers added to all necessary files"
