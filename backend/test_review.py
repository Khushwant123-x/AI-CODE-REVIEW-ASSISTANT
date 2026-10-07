def calculate_total(items):
    total = 0
    for item in items:
        total += item["price"]
    return total


def main():
    items = [
        {"name": "Laptop", "price": 50000},
        {"name": "Mouse", "price": 1000},
    ]

    print(calculate_total(items))


if __name__ == "__main__":
    main()