import threading
import time
import random

class Consumer(threading.Thread):
    def __init__(self,semaphore,lst,items):
        super().__init__()
        self.semaphore = semaphore
        self.lst = lst
        self.items = items
    
    def run(self):
        for i in range (self.items):
            self.semaphore.acquire()
            item = self.lst.pop(0)
            print(f"Consumidor saco: {item}")
            time.sleep(random.uniform(0.5,1.5))
            

class Producer(threading.Thread):
    def __init__(self,semaphore,lst,items):
        super().__init__()
        self.semaphore = semaphore
        self.lst = lst
        self.items = items
    
    def run(self):
        for i in range (self.items):
            time.sleep(random.uniform(0.5,1.5))
            item = random.randint(0,100)
            self.lst.append(item)
            print(f"Productor trajo: {item}")
            self.semaphore.release()

def main():
    semaphore = threading.Semaphore(0)
    lst = []
    items = 10
    
    producer = Producer(semaphore,lst,items)
    consumer = Consumer(semaphore,lst,items)
    
    producer.start()
    consumer.start()

    producer.join()
    consumer.join()
    

if __name__ == "__main__":
    main()