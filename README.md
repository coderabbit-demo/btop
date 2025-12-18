# btop

A web-based system monitor built with React, TypeScript, and Vite. Inspired by the popular [btop](https://github.com/aristocratos/btop) command-line tool, this application provides real-time monitoring of system resources in your browser.

## Features

- Real-time CPU usage graphs with per-core breakdown
- Memory usage monitoring and visualization
- Process table with filtering capabilities
- Environment variables panel for system diagnostics
- Configurable refresh rate
- Dark theme optimized for monitoring

## btop quiet

This repository uses **btop quiet** mode, which disables graph line smoothing for a cleaner, more accurate visualization. The graphs use linear interpolation (`type="linear"`) instead of smooth curves, providing:

- More accurate representation of actual metric values
- Reduced visual noise and distractions
- Sharper, more precise data points
- Better performance with less rendering overhead

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) runtime installed

### Installation

```bash
bun install
```

### Running the Application

Start both the server and frontend:

```bash
bun run start
```

Or run them separately:

```bash
# Start the backend server
bun run server

# Start the frontend dev server
bun run dev
```

The application will be available at `http://localhost:5173`.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Charts**: Recharts
- **Backend**: Bun
- **Styling**: CSS
