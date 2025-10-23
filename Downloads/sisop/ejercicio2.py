import threading

class Sala: 
    def __init__(self, nombre, asientos): 
        self.nombre = nombre
        self.asientos = asientos
        self.lock = threading.Lock()

    def getAsientos(self):
        return self.asientos

    def __str__(self):
        return f"Sala {self.nombre}"


class Cine: 
    def __init__(self, salas):
        self.salas = salas

    def realizarReserva(self, sala, cantidad):
        with sala.lock:  
            reservados = []
            for asiento, libre in sala.asientos.items():
                if libre:
                    sala.asientos[asiento] = False
                    reservados.append(asiento)
                    if len(reservados) == cantidad:
                        break
            if len(reservados) < cantidad:
                print(f"No hay suficientes asientos disponibles en {sala}.")
            else:
                print(f"Reserva realizada en {sala}:  {reservados}")


class Usuario(threading.Thread):
    def __init__(self, id, cine, sala, cant): 
        super().__init__()
        self.name = f"Usuario {id}"
        self.cine = cine
        self.sala = sala
        self.cant = cant

    def run(self):
        print(f"{self.name} intenta reservar {self.cant} asientos en {self.sala}")
        self.cine.realizarReserva(self.sala, self.cant)
        print(f"{self.name} terminó su reserva.\n")


def main():
    A = Sala("A", {'1':True , '2':True  , '3': True, '4': True , '5' : True})
    B = Sala("B", {'1':True , '2':True  , '3': True, '4': True , '5' : True})
    C = Sala("C", {'1':True , '2':True  , '3': True, '4': True , '5' : True})
    cine = Cine([A,B,C])

    users = [
        Usuario(0, cine, A, 3),
        Usuario(1, cine, A, 1),
        Usuario(2, cine, B, 4),
        Usuario(3, cine, B, 1),
        Usuario(4, cine, C, 3),
        Usuario(5, cine, C, 2),
    ]
    
    for usuario in users:
        usuario.start()

    for usuario in users:
        usuario.join()


if __name__ == "__main__":
    main()

