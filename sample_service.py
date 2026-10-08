"""
Sample service with intentional code defects to test AI code review comments.
"""

def process_user_query(query: str, secret_key: str = "SUPER_SECRET_API_KEY_12345"):
    # Security issue: Hardcoded sensitive secret
    print(f"Connecting with secret {secret_key}")

    # Critical security vulnerability: Insecure eval of user input
    result = eval(query)

    # Bug: Division by zero risk
    divisor = 0
    calculated = 100 / divisor

    return result, calculated
