import threading
import time
import random

class Estacion(threading.Thread):
    def __init__(self,nombre,evento_anterior,evento_siguiente):
        super().__init__()
        self.nombre = nombre
        self.evento_anterior = evento_anterior
        self.evento_siguiente = evento_siguiente
    
    def run(self):
        if self.evento_anterior:
            print(f"{self.nombre} esta esperando a que termine la tarea anterior\n", end="")
            self.evento_anterior.wait()
        
        print(f"{self.nombre} esta produciendo\n", end="")
        time.sleep(random.uniform(3,5))
        print(f"{self.nombre} termino\n", end="")
        if self.evento_siguiente:
            self.evento_siguiente.set()
        

def main():
    evento1 = threading.Event()
    evento2 = threading.Event()
    evento3 = threading.Event()
    
    estacion1 = Estacion("Estacion 1",None,evento1)
    estacion2 = Estacion("Estacion 2",evento1,evento2)
    estacion3 = Estacion("Estacion 3",evento2,evento3)
    
    estacion1.start()
    estacion2.start()
    estacion3.start()
    
    estacion1.join()
    estacion2.join()
    estacion3.join()

if __name__ == "__main__":
    main()