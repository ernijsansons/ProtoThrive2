import { useStore } from "@/store";

export function Footer() {
  const { footer, triggerDeploy } = useStore();

  return (
    <footer className="flex items-center justify-between p-4 bg-background/80 backdrop-blur-md border-t border-border">
      <div>
        <p className="text-sm text-muted-foreground">
          v{footer.buildInfo.version} ({footer.buildInfo.buildId})
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <p className="text-sm text-muted-foreground">System: <span className={`font-semibold ${footer.systemStatus.overall === 'healthy' ? 'text-green-500' : 'text-red-500'}`}>{footer.systemStatus.overall}</span></p>
        <p className="text-sm text-muted-foreground">Deployment: <span className={`font-semibold ${footer.deploymentStatus === 'deployed' ? 'text-green-500' : 'text-yellow-500'}`}>{footer.deploymentStatus}</span></p>
        <button 
          onClick={triggerDeploy} 
          disabled={footer.isDeploying}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm transition-colors duration-200"
        >
          {footer.isDeploying ? `Deploying... (${footer.deployProgress}%)` : "Deploy"}
        </button>
      </div>
    </footer>
  );
}