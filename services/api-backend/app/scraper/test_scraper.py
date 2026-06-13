# Import the function from your scraper.py file
from playwright_hub import fetch_image

def run_test():
    # A test URL for Zara
    test_url = "https://www.zara.com/us/en/100-linen-polo-shirt-p02634252.html?v1=548796518"
    
    print(f"--- Starting test for: {test_url} ---")
    
    # Call your function
    result_path = fetch_image(test_url)
    
    # Check the result
    if result_path:
        print(f"SUCCESS! Image saved at: {result_path}")
    else:
        print("FAILURE! The scraper did not return an image path.")

if __name__ == "__main__":
    run_test()