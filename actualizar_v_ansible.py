#!/usr/bin/env python3
import json
import os
import yaml

def update_ansible_vars():
    # File paths
    db_file = 'db.json'
    # Fallback to os.db if db.json doesn't exist (as per user mention)
    if not os.path.exists(db_file):
        db_file = 'os.db'
    
    output_dir = 'ansible/host_vars/localhost'
    output_file = os.path.join(output_dir, 'packages.yml')

    if not os.path.exists(db_file):
        print(f"Error: Neither db.json nor os.db found.")
        return

    try:
        with open(db_file, 'r') as f:
            data = json.load(f)
        
        hosts = data.get('hosts', [])
        packages = []
        for host in hosts:
            pkg = host.get('paquete')
            if pkg:
                packages.append(pkg)
        
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)
        
        # Prepare data for YAML
        ansible_vars = {
            'packages_to_install': packages
        }
        
        # Write to packages.yml
        with open(output_file, 'w') as f:
            f.write("# Generado automáticamente desde db.json / os.db\n")
            yaml.dump(ansible_vars, f, default_flow_style=False)
            
        print(f"Successfully updated {output_file} with packages: {', '.join(packages)}")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    update_ansible_vars()
