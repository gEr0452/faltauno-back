import threading
import time
import random

class Runner(threading.Thread):
    estanTodos = True
    
    def __init__(self,nombre,barrera):
        super().__init__()
        self.nombre = nombre
        self.barrera = barrera
    
    def run(self):
        self.iniciar_carrera()
        
    def iniciar_carrera(self):
        time.sleep(random.uniform(3,5))
        print(f"El {self.nombre} esta listo\n", end="")
        
        self.barrera.wait()
        
        if Runner.estanTodos:
            Runner.estanTodos = False
            print("Inicia la carrera\n", end="")
            
        print(f"El {self.nombre} termino la carrera\n", end="")        
        

def main():
    barrera = threading.Barrier(5)
    corredores = []
    
    for i in range(5):
        corredor = Runner(f"Corredor {i}",barrera)
        corredores.append(corredor)
    
    for u in corredores:
        u.start()
    
    for u in corredores:
        u.join()

if __name__ == "__main__":
    main()