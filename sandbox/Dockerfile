FROM ruby:3.2-alpine

# Security options
RUN adduser -D sandboxuser
USER sandboxuser

# App directory inside container
WORKDIR /app

# This runner executes the AI code file
COPY runner.rb /app/runner.rb

CMD ["ruby", "/app/runner.rb"]
