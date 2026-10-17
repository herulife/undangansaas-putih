package main

import "testing"

func TestMidtransIsValid(t *testing.T) {
	t.Setenv("MIDTRANS_SERVER_KEY", "")
	if midtransIsValid() {
		t.Fatal("midtrans should be invalid without a server key")
	}
	t.Setenv("MIDTRANS_SERVER_KEY", "SB-Mid-server-test")
	if !midtransIsValid() {
		t.Fatal("midtrans should be valid with a server key")
	}
}

func TestMidtransBaseURLDefault(t *testing.T) {
	t.Setenv("MIDTRANS_BASE_URL", "")
	if got := midtransBaseURL(); got != "https://app.sandbox.midtrans.com" {
		t.Fatalf("midtransBaseURL = %q", got)
	}
	t.Setenv("MIDTRANS_BASE_URL", "https://app.midtrans.com")
	if got := midtransBaseURL(); got != "https://app.midtrans.com" {
		t.Fatalf("midtransBaseURL = %q", got)
	}
}
