import subprocess

def run_command(command):
    print(f"Running: {command}")
    result = subprocess.run(command, shell=True)
    
    if result.returncode != 0:
        print(f"Error while running: {command}")
        exit(1)

if __name__ == "__main__":
    run_command("npm run clean")
    run_command("npm run build")
    run_command("npm start")