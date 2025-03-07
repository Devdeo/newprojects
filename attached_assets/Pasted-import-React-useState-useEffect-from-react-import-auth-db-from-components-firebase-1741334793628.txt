import React, { useState, useEffect } from "react";
import { auth, db } from "../components/firebaseConfig";
import Link from "next/link";
import Image from "next/image";
import { useAuthState } from "react-firebase-hooks/auth";
import { query, collection, getDocs, where, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/router";

function Course(){
    const [plan, setPlan] = useState("");
    const [payid, setPayid] = useState("");
    const [odid, setOdid] = useState("");
    const [user, loading] = useAuthState(auth);
    const router = useRouter();

    const makePayment = async () => {
      console.log("here...");
      const res = await initializeRazorpay();
  
      if (!res) {
        alert("Razorpay SDK Failed to load");
        return;
      }
  
      // Make API call to the serverless API
      const data = await fetch("/api/razorpay", { method: "POST" }).then((t) =>
        t.json()
      );
      console.log(data);
      var options = {
        key: process.env.RAZORPAY_KEY, // Enter the Key ID generated from the Dashboard
        name: "Dev Trap Trader",
        currency: data.currency,
        amount: data.amount,
        order_id: data.id,
        description: "Buy Now best trading course",
        image: "/logo.png",
        handler: function (response) {
          setPayid(response.razorpay_payment_id);
          setOdid(response.razorpay_order_id);
          alert("Thanks for purchasing. Your Payment id is-"+response.razorpay_payment_id+". and order is"+response.razorpay_order_id);
          upate();
        },
        prefill: {
          name: "Dev Trap Trading",
          email: "devildevid2@gmail.com",
          contact: "8887922312",
        },
      };
  
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    };
    const initializeRazorpay = () => {
      return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        // document.body.appendChild(script);
  
        script.onload = () => {
          resolve(true);
        };
        script.onerror = () => {
          resolve(false);
        };
  
        document.body.appendChild(script);
      });
    };
    const upate = async () =>{
    try {
      const currentDate = new Date();

      // Format the date as needed
      const formattedDate = currentDate.toDateString();
        const q = query(collection(db, "users"), where("uid", "==", user.uid));
        const docs = await getDocs(q);
        if (docs.docs.length === 1) {
          const userRef = doc(db, "users", docs.docs[0].id);
          await updateDoc(userRef, {
            plan : 'paid',
            date : formattedDate,
            odid: odid,
            payid : payid, 

          });
        }
        router.push('/scrap');
      } catch (err) {
        console.error(err);
        alert(err.message);
      }
    }

    useEffect(() => {
        if (loading) return;
        if (!user) {
          router.push('/login');
        };
    
        fetchUserName();
      }, [user, loading]);
      const fetchUserName = async () => {
        try {
        const q = query(collection(db, "users"), where("uid", "==", user?.uid));
        const doc = await getDocs(q);
        const data = doc.docs[0].data();
        setPlan(data.plan);

        
        } catch (err) {
        console.error(err);
        alert("An error occured while fetching user data");
        }
    };
    const Plans =() =>{
        if (plan==="paid"){
            return (
                <Link href="/scrap" className="button is-dark">Explore Now</Link>
            )
        }if (plan==="free"){
            return(
                <>
    
                <button onClick={makePayment} className="button is-dark"> Buy Now Rs499/-</button>
                </>
            )
        }
    }
    return(
        <>
        <div className="columns box is-centered">
            <div className="column has-text-left is-half mt-6 ml-6">
            
            <Image 
            src="/screenshot.png"
            width={500}
            height={500}
            alt="scrensot"
            />
            <p><strong>Trading Basic To Advance (Price Action, Trading Setup)</strong></p>
            <br />
            <ol className="mt-1 ml-1">
                <li>
                BASIC INFORMATION OF STOCK MARKET
                </li>
                <li>
                DAY TRADE (INTRADAY & FnO)
                </li>
                <li>
                PRICE ACTION (BEGINNER-CANDLESTICK PATTERN & CHART PATTERN)
                </li>
                <li>
                PRICE ACTION (INTERMEDIATE-TREND, SUPPORT &REGISTANT, TECHNICAL INDIGATOR)
                </li>
                <li>
                PRICE ACTION (ADVANCE-OI CHART DATA & OPERATOR MIND SET)
                </li>
                <li>
                MAKING  PROFITABLE  STRATEGY USING PRICE ACTION & BACKTEST YOUR STRATEGY
                </li>
            </ol>
                <Plans />
            </div>

        </div>
        </>
    )
}

export default Course;