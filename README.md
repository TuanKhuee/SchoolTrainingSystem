# EduChain (School Training System)

EduChain is a comprehensive School Training System that integrates traditional educational management with blockchain technology. 

## 🏗 Project Architecture

The project consists of three main components:
*   **Backend**: Built with ASP.NET Core (.NET 8/9), providing RESTful APIs for the application.
*   **Frontend**: Built with Next.js 15, React 19, TailwindCSS, and Wagmi/Viem for Web3 interactions.
*   **Smart Contracts**: Written in Solidity, managed and tested via Hardhat, running on a local Ethereum network or Sepolia testnet.
*   **Database**: Microsoft SQL Server 2022.

## 🚀 Getting Started (Running Locally)

The easiest way to run the entire stack locally is by using Docker and Docker Compose. This approach automatically spins up the SQL Server database, the local hardhat node, the backend API, and the frontend web app.

### Prerequisites
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
*   Git for version control.

### Method 1: Using Docker Compose (Recommended)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/TuanKhuee/SchoolTrainingSystem.git
    cd SchoolTrainingSystem
    ```

2.  **Run Docker Compose:**
    ```bash
    docker-compose up -d --build
    ```
    *This will download the necessary base images, build the backend, frontend, and blockchain containers, and start them.*

3.  **Access the applications:**
    *   **Frontend (Web UI)**: `http://localhost:3001`
    *   **Backend (API + Swagger)**: `http://localhost:5000/swagger`
    *   **SQL Server**: `localhost:1433` (User: `sa`, Password: `EduChain@2024!`)
    *   **Blockchain Node**: `http://localhost:8545`

4.  **Stopping the system:**
    ```bash
    docker-compose down
    ```

### Method 2: Manual Setup (Development Mode)

If you prefer to run services individually for intensive development:

**Prerequisites:**
*   [.NET SDK](https://dotnet.microsoft.com/download)
*   [Node.js](https://nodejs.org/) (v18+)
*   SQL Server (Local, Dockerized, or Cloud)

#### 1. Database & Blockchain setup
Either use a remote SQL Server and Sepolia Testnet, or spin up the local infra:
```bash
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=EduChain@2024!" -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest
```

Navigate to the `smartContract` folder and start the local hardhat node:
```bash
cd smartContract
npm install
npx hardhat node
```

#### 2. Backend
Navigate to the backend directory, configure `appsettings.Development.json` if necessary, and run:
```bash
cd backend
dotnet restore
dotnet run
```
*API will usually be available at `http://localhost:5219` or `http://localhost:5000` (check terminal output).*

#### 3. Frontend
Navigate to the frontend directory, install dependencies, and run:
```bash
cd frontend
npm install
# Copy the environment file if needed:
# cp .env.example .env.local
npm run dev
```
*Frontend will be available at `http://localhost:3000`.*

## 📂 Project Structure

```
SchoolTrainingSystem/
├── backend/            # ASP.NET Core API, Entity Framework Core, Services
├── frontend/           # Next.js App Router, React Query, Web3Modal, UI
├── smartContract/      # Solidity contracts, Hardhat configuration & scripts
├── docker-compose.yml  # Docker infrastructure definition
└── .github/            # CI/CD Workflows
```

## 🔒 Security & Environment Variables

Make sure to properly set up your environment variables if you are deploying to production.
Do not commit sensitive keys (like Alchemy RPC URLs, private keys, or actual database passwords) to public repositories. 
See `.env.example` configurations in respective folders to understand required keys.
