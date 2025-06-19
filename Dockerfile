# Use a minimal Python image
FROM python:3.12-slim-bookworm

# Install uv by copying the binary from the official distroless image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set environment variables for best practices
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV UV_LINK_MODE=copy

# Set the working directory
WORKDIR /app

# Copy only dependency files first for better caching
COPY pyproject.toml uv.lock ./

# Install dependencies (without installing the project itself)
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-install-project

# Now copy the rest of the project
COPY . .

# Install the project itself
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked

# Ensure the virtualenv's bin is on the PATH so common-rules is found
ENV PATH="/app/.venv/bin:$PATH"

# Set the default command
CMD ["common-rules"]