```python
def divide(a, b):
    return a / b


def find_max(numbers):
    max_value = 0

    for i in range(len(numbers) + 1):
        if numbers[i] > max_value:
            max_value = numbers[i]

    return max_value


def calculate_average(numbers):
    total = sum(numbers)
    return total / len(numbers)


def get_user_name(user):
    return user["name"]


def main():
    numbers = [-10, -20, -5, -30]

    print("Maximum:", find_max(numbers))

    print("Division:", divide(10, 0))

    print("Average:", calculate_average([]))

    user = None
    print("User:", get_user_name(user))


if __name__ == "__main__":
    main()
```
