---
title: "🐦‍🔥Beginner-Friendly Guide \"Plus One\" – LeetCode 66 (C++ | Python | JavaScript)"
description: "We've all used a calculator, but have you ever wondered how a computer handles adding one to a number..."
author: "Om Shree"
publishDate: 2026-01-01T05:56:57Z
featuredImage: "https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F0bo0lznmuy6xxmw2va5r.png"
category: "programming"
tags: ["programming", "cpp", "python", "javascript"]
draft: false
---

We've all used a calculator, but have you ever wondered how a computer handles adding one to a number when that number is stored as an array? Today we are looking at "Plus One," a classic interview problem that tests your understanding of arrays and basic carry math. It sounds simple, but those pesky "9s" can make things interesting!

Let’s break it down, step by step. 🔍

### 🧠 Problem Summary

**You're given:**
An array of integers `digits`, representing a large number (e.g.,  represents ).

**Your goal:**
Increment the large integer by one and return the resulting array.

* The digits are ordered from most significant to least significant.
* No leading zeros (unless the number is  itself).

### 💡 Intuition

When we add  to a number, we always start at the **rightmost digit** (the least significant digit).

1. If the digit is less than , we simply increment it by  and we are done!
2. If the digit is , incrementing it makes it . In this case, we set the current digit to  and "carry" the  to the next digit on the left.
3. **The Edge Case:** What if all digits are  (like )? After turning all of them into , we still have a carry left. We need to insert a  at the very beginning of the array to get .

### 🛠️ C++ Code

```cpp
class Solution {
public:
    vector<int> plusOne(vector<int>& digits) {
        for (int i = digits.size() - 1; i >= 0; --i) {
            if (digits[i] < 9) {
                ++digits[i];
                return digits;
            }
            digits[i] = 0;
        }

        digits.insert(digits.begin(), 1);
        return digits;
    }
};

```

### 🐍 Python Code

```python
class Solution:
    def plusOne(self, digits: List[int]) -> List[int]:
        for i in range(len(digits) - 1, -1, -1):
            if digits[i] < 9:
                digits[i] += 1
                return digits
            digits[i] = 0
            
        # If we reach here, it means all digits were 9
        return [1] + digits

```

### 💻 JavaScript Code

```javascript
var plusOne = function(digits) {
    for (let i = digits.length - 1; i >= 0; i--) {
        if (digits[i] < 9) {
            digits[i]++;
            return digits;
        }
        digits[i] = 0;
    }

    // If we reach here, it means all digits were 9
    digits.unshift(1);
    return digits;
};

```

---

### 📝 Key Takeaways

* **Reverse Traversal:** Always start from the end of the array when performing addition to handle carries correctly.
* **Early Return:** If a digit is less than , there is no carry-over to the next position, so we can return the result immediately.
* **Array Manipulation:** Knowing how to add an element to the front of an array (`insert` in C++, `unshift` in JS, or list concatenation in Python) is crucial for cases like .

### ✅ Final Thoughts

This problem is a perfect example of how simple logic can handle "large integers" that would otherwise overflow standard integer types in many languages. It's all about managing that carry!

