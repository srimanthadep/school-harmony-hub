import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Class data extracted from Excel files
  const classData: { class: string; fee: number; students: { name: string; father: string; phone: string }[] }[] = [
    {
      class: "1st", fee: 12000,
      students: [
        { name: "Ayesha", father: "Sameer", phone: "7989484506" },
        { name: "Ashwitha B", father: "Suresh", phone: "9951486462" },
        { name: "Dharshini K", father: "Ashok Kumar", phone: "9640844436" },
        { name: "Karunya Ch", father: "Shankar", phone: "9603402799" },
        { name: "Meghana U", father: "Saidulu", phone: "720783724" },
        { name: "Praveena J", father: "Krishnaiah", phone: "9705705009" },
        { name: "Prajwala S", father: "Srinu", phone: "9603471525" },
        { name: "Sruthi N", father: "Prasad", phone: "8106551851" },
        { name: "Shariya Sk", father: "Shakeel", phone: "9133175215" },
        { name: "Uzma Md", father: "Jubair", phone: "7013797983" },
        { name: "Vidhyasri P", father: "Sridhar", phone: "9705372383" },
        { name: "Yashaswi P", father: "Papaiah", phone: "9908423474" },
        { name: "Nithyasri B", father: "Mahesh", phone: "7680094846" },
        { name: "Azmal Md", father: "Amzad", phone: "9959010708" },
        { name: "Ahil Sk", father: "Moinoddin", phone: "9700881575" },
        { name: "Aban Sk", father: "Zamal", phone: "8886182467" },
        { name: "Ayush D", father: "Upendar", phone: "9705539839" },
        { name: "Aazan Md", father: "Sameeroddin", phone: "9640514348" },
        { name: "Bhargav Ram", father: "Parent", phone: "" },
        { name: "Jeshwin B", father: "Vasu", phone: "6302231180" },
        { name: "Lokhesh P", father: "Vijay", phone: "9963043457" },
        { name: "Mallikarjun K", father: "Jangaiah", phone: "8341433980" },
        { name: "Prasanna Vihan", father: "Thirumalaiah", phone: "9676028857" },
        { name: "Pranay G", father: "Parent", phone: "" },
        { name: "Ravi Das", father: "Shekar", phone: "9849704185" },
        { name: "Rishith Reddy", father: "Dilip Reddy", phone: "9133112323" },
        { name: "Rishidhar V", father: "C Shekar", phone: "9121203288" },
        { name: "Raghavendra K", father: "Mahesh", phone: "8886740781" },
        { name: "Ruthwik", father: "Parent", phone: "" },
        { name: "Shashivardhan", father: "Naresh", phone: "8498057137" },
        { name: "Sathwik I", father: "Saidulu", phone: "8184976247" },
        { name: "Saiban Md", father: "Yousuf", phone: "9603519616" },
        { name: "Sathwik P", father: "Thirumalaiah", phone: "9676028857" },
        { name: "Sreyansh", father: "Parent", phone: "" },
        { name: "Vidhwan R", father: "Parent", phone: "" },
        { name: "Thanish K", father: "Sathish", phone: "9505819917" },
        { name: "Thanush P", father: "Venkanna", phone: "6302608819" },
        { name: "Yashwanth Ch", father: "Venkanna", phone: "9912280744" },
      ],
    },
    {
      class: "2nd", fee: 13000,
      students: [
        { name: "Aadhya M", father: "Linga Swamy", phone: "8921751752" },
        { name: "Aaradhya D", father: "Saidulu", phone: "8143916601" },
        { name: "Ananya A", father: "Swamy", phone: "9010914047" },
        { name: "Akshara A", father: "Murali", phone: "9666538925" },
        { name: "Chaithra I", father: "Venkanna", phone: "9989351474" },
        { name: "Ishwarya K", father: "Bala", phone: "9515147230" },
        { name: "Jhoshna K", father: "Narsimha", phone: "9705831417" },
        { name: "Nithyasri P", father: "Upendar", phone: "8688026851" },
        { name: "Niveda G", father: "Linga Swamy", phone: "9381818501" },
        { name: "Prakruthi J", father: "Naresh", phone: "9666357110" },
        { name: "Rithwika K", father: "Swamy", phone: "9912095449" },
        { name: "Sathwika K", father: "Yakob", phone: "9959470017" },
        { name: "Ujwala S", father: "Srinu", phone: "9010048353" },
        { name: "Vaishnavi N", father: "Raju", phone: "8499966632" },
        { name: "Vijaya Laxmi", father: "Parent", phone: "" },
        { name: "Abhinav Ch", father: "Parent", phone: "" },
        { name: "Deekshith G", father: "Ravi", phone: "9963809753" },
        { name: "Devansh N", father: "Suman", phone: "9502985896" },
        { name: "Devansh Ch", father: "Paramesh", phone: "7780328303" },
        { name: "Dhanush J", father: "Bixam", phone: "9948368422" },
        { name: "Goutham Kumar", father: "Shiva", phone: "7093372340" },
        { name: "Harsha wardhan K", father: "Mahesh", phone: "8886740781" },
        { name: "Harshith B", father: "Srinu", phone: "9948557232" },
        { name: "Harshith Sai P", father: "Eshwar", phone: "9110765579" },
        { name: "Huzair Md", father: "Jubair", phone: "9573524673" },
        { name: "Izwan", father: "Srikanth", phone: "8179273909" },
        { name: "Jeshwanth S", father: "Sathish", phone: "9398520755" },
        { name: "Jeshwith P", father: "Nagaraju", phone: "9700704614" },
        { name: "Mokshith B", father: "Linga Swamy", phone: "9177117909" },
        { name: "Mokshith J", father: "Ravi", phone: "7989891678" },
        { name: "Pranith M", father: "Raju", phone: "9010259329" },
        { name: "Pranay J", father: "Srisailam", phone: "9948102984" },
        { name: "Reshwanth N", father: "Raju", phone: "7337059215" },
        { name: "Varun Tej A", father: "Mallesham", phone: "9948198543" },
        { name: "Vikranth Ch", father: "Ramesh", phone: "9390734305" },
        { name: "Sri Harshwadhan", father: "Saidulu", phone: "7569192982" },
        { name: "Shoaib Sk", father: "Sameer", phone: "7989484506" },
        { name: "Thaneesh R", father: "Swamy", phone: "9640662287" },
        { name: "Uthej Ch", father: "Naaraju", phone: "7416841357" },
        { name: "Varshith S", father: "Ravi", phone: "9951820102" },
      ],
    },
    {
      class: "3rd", fee: 14000,
      students: [
        { name: "Akshara B", father: "Venkatesh", phone: "9848407177" },
        { name: "Aadhya K", father: "Ramakrishna", phone: "8374378588" },
        { name: "Aaradhya M", father: "Linga Swamy", phone: "8121751752" },
        { name: "Chaithra S", father: "Devaraju", phone: "9398919840" },
        { name: "Geethika J", father: "Krishnaiah", phone: "9705705009" },
        { name: "Hithaishi E", father: "Pichi Reddy", phone: "8341107660" },
        { name: "Sangeetha Patra", father: "Swetha", phone: "6370064113" },
        { name: "Shahistha Sk", father: "Shakil Khan", phone: "9133175215" },
        { name: "Sloka A", father: "Naresh", phone: "9963818282" },
        { name: "Akhiranandan", father: "Paramesh", phone: "" },
        { name: "Asad Sk", father: "Jamal", phone: "8886182467" },
        { name: "Ayan Sk", father: "Nazeer", phone: "9951579082" },
        { name: "Kushwanth", father: "Raju", phone: "9010914457" },
        { name: "Manikanta E", father: "Narsimha", phone: "9948915130" },
        { name: "Nandu M", father: "Sudhakar", phone: "9951014896" },
        { name: "Paradeep A", father: "Ramesh", phone: "9553511291" },
        { name: "Poojith Reddy", father: "Dilip Reddy", phone: "9133112323" },
        { name: "Pranith Kumar", father: "Kiran", phone: "9032532238" },
        { name: "Sujith S", father: "Yadagiri", phone: "8096125431" },
        { name: "Sunny O", father: "Swamy", phone: "9705890125" },
        { name: "Varun Tej", father: "Srikanth", phone: "9392117783" },
      ],
    },
    {
      class: "4th", fee: 15000,
      students: [
        { name: "Aaradhya P", father: "Srisailam", phone: "7730874137" },
        { name: "Avanthika Ch", father: "Nagaraju", phone: "9963446992" },
        { name: "Charanya Ch", father: "Shankar", phone: "9603402799" },
        { name: "Lasya E", father: "Saidulu", phone: "9010871981" },
        { name: "Lasya K", father: "Sathish", phone: "9505819917" },
        { name: "Pooja M", father: "Raju", phone: "9502226694" },
        { name: "Nida", father: "Khaleem", phone: "9701322480" },
        { name: "Sai karthika J", father: "Srinu", phone: "9059486046" },
        { name: "Sindhu Devi", father: "Mallikarjun", phone: "9059597880" },
        { name: "Siri N", father: "Sairam", phone: "9666497770" },
        { name: "Thanusri", father: "Parent", phone: "" },
        { name: "Varshini M", father: "Hari", phone: "8096834013" },
        { name: "Vidhya Nirvana", father: "Upendar", phone: "7659882366" },
        { name: "Anshith V", father: "Naresh", phone: "6302401097" },
        { name: "Bharath P", father: "Shekar", phone: "8341009209" },
        { name: "Dheraj P", father: "Rakhesh", phone: "7396145612" },
        { name: "Rohan G", father: "Linga Swamy", phone: "9381818501" },
        { name: "Ruthwik B", father: "Ramesh", phone: "8374508962" },
        { name: "Sourab M", father: "B Shankar", phone: "7995257274" },
        { name: "Soiab Md", father: "Shabeer", phone: "9010694022" },
        { name: "Varun Tej", father: "Venkatesh", phone: "9848407171" },
        { name: "Vishal A", father: "Mallesham", phone: "9948198543" },
        { name: "Sathwik O", father: "Swamy", phone: "9505009670" },
      ],
    },
    {
      class: "5th", fee: 16000,
      students: [
        { name: "Adiba", father: "Aleemoddin", phone: "703244553" },
        { name: "Deekshitha S", father: "Yadagiri", phone: "8096125431" },
        { name: "Nagalaxmi B", father: "Mallikarjun", phone: "9059597880" },
        { name: "Sathwika Y", father: "Mallesh", phone: "9963732190" },
        { name: "Shruthika G", father: "Shekar", phone: "8501989071" },
        { name: "Swathi Ch", father: "Venkanna", phone: "9912280744" },
        { name: "Sahasra M", father: "Saidulu", phone: "9951163592" },
        { name: "Abhiram P", father: "Papaiah", phone: "9908423474" },
        { name: "Goutham Sai", father: "Ashok", phone: "7386441906" },
        { name: "Hemanth B", father: "Srinu", phone: "9704463482" },
        { name: "Lokhesh Reddy", father: "Pichi Reddy", phone: "7702593113" },
        { name: "Mallikarjun S", father: "Mahesh", phone: "8297373735" },
        { name: "Manish M", father: "Madhu", phone: "8688167328" },
        { name: "Ruthwik P", father: "Krishna", phone: "9542220440" },
        { name: "Sai Manikanta", father: "Gopala Swamy", phone: "9951680203" },
        { name: "Sohansh Kumar K", father: "Kanaka Chary", phone: "9182596265" },
        { name: "Sidhartha A", father: "Naresh", phone: "8008834202" },
        { name: "Sreyansh", father: "Parent", phone: "" },
        { name: "Harsha P", father: "Uma Mahesh", phone: "9666592642" },
        { name: "Varun Tej Ch", father: "Mallesh", phone: "8464084452" },
        { name: "Yashwanth P", father: "Saidulu", phone: "7893420904" },
      ],
    },
    {
      class: "6th", fee: 17000,
      students: [
        { name: "Akshara M", father: "Raju", phone: "7989849735" },
        { name: "Ananya N", father: "Shankar", phone: "6303848175" },
        { name: "Nithya Ch", father: "Nagaraju", phone: "9542566350" },
        { name: "Pooja B", father: "Lingswamy", phone: "9603895149" },
        { name: "Abhilash Reddy", father: "Shiva Shankar", phone: "9505894253" },
        { name: "Harishwar K", father: "S Chary", phone: "9912640498" },
        { name: "Manikanta P", father: "Anjaiah", phone: "9010511720" },
        { name: "Pavan", father: "Lingaiah", phone: "9705342190" },
        { name: "Sai Aadhithya", father: "Eshwar", phone: "9110765579" },
        { name: "Surya Teja P", father: "Yadagiri", phone: "9666783589" },
        { name: "Tiyansh P", father: "Kiran", phone: "8790092189" },
        { name: "Teja G", father: "Parent", phone: "" },
        { name: "Vignesh G", father: "Venu", phone: "9912460600" },
        { name: "Umesh A", father: "Mallesh", phone: "9676538044" },
      ],
    },
    {
      class: "7th", fee: 18000,
      students: [
        { name: "Akshara Ch", father: "Nagaraju", phone: "6281470040" },
        { name: "Akshiara P", father: "Jagadesh", phone: "9542654650" },
        { name: "Hemasri S", father: "Sathish", phone: "9398520755" },
        { name: "Ishwarya P", father: "Uma Mahesh", phone: "9666592642" },
        { name: "Jhansi P", father: "Mallesham", phone: "9666030665" },
        { name: "Keerthi M", father: "Saidulu", phone: "9848684197" },
        { name: "Lasya M", father: "Mallesh", phone: "9912461600" },
        { name: "Mounika Y", father: "Mallesh", phone: "6281330939" },
        { name: "Zoha Md", father: "Chand Pasha", phone: "9030722510" },
        { name: "Aadhithya", father: "Venkat Reddy", phone: "9848526902" },
        { name: "Affan Ansari", father: "Parent", phone: "9010694022" },
        { name: "Charan Kumar G", father: "Shekar", phone: "9963358337" },
        { name: "Farhan P", father: "Imran Khan", phone: "9948013572" },
        { name: "Harshawardhan G", father: "Laxmaiah", phone: "9542745053" },
        { name: "Laxmi Narsimha", father: "Ramesh", phone: "9912405088" },
        { name: "Mani Teja B", father: "Venkatesh", phone: "9848407177" },
        { name: "Mokshith S", father: "Chandra Shekar", phone: "9966149481" },
        { name: "Pranab Ch", father: "Naresh", phone: "9842311438" },
        { name: "Revanth B", father: "Srinivas", phone: "9177816245" },
        { name: "Rehan Md", father: "Parent", phone: "" },
        { name: "Sathwik P", father: "Parent", phone: "" },
        { name: "Umar Md", father: "Shareef", phone: "9951026526" },
        { name: "Vigneshwar R", father: "Parent", phone: "" },
        { name: "Thanush Kumar", father: "Bixamaiah", phone: "9676160382" },
        { name: "Thanush Kumar", father: "Bixamaiah", phone: "8463959187" },
      ],
    },
    {
      class: "8th", fee: 19000,
      students: [
        { name: "Akshitha Ch", father: "Srisailam", phone: "9603962091" },
        { name: "Anugna M", father: "Swamy", phone: "9381034428" },
        { name: "Bhavyasri P", father: "Papaiah", phone: "9908423474" },
        { name: "Hasini K", father: "S Chary", phone: "9912640498" },
        { name: "Manisha B", father: "Linga Swamy", phone: "9603895149" },
        { name: "Nandu B", father: "Srisailam", phone: "9848242885" },
        { name: "Ravithrayani B", father: "Linga Swamy", phone: "9000972852" },
        { name: "Renuka K", father: "Parent", phone: "" },
        { name: "Yamini B", father: "Nagarjuna", phone: "9848412767" },
        { name: "Sakshara P", father: "B Narsimha", phone: "9848062867" },
        { name: "Vidhyasri P", father: "Mallesham", phone: "9989103811" },
        { name: "Nandini k", father: "Narsimha", phone: "9705831417" },
        { name: "Siri Vennala J", father: "Shekar", phone: "8639053585" },
        { name: "Lohith B", father: "Venkatesh", phone: "9515226768" },
        { name: "Manikanta O", father: "Raju", phone: "9912583932" },
        { name: "Sushanth P", father: "Parent", phone: "" },
        { name: "Sai Pranith G", father: "Narsimha", phone: "9912953232" },
        { name: "Vishwa Teja P", father: "Yadagiri", phone: "9666783589" },
        { name: "Yashwanth P", father: "Ashok", phone: "9666518682" },
      ],
    },
    {
      class: "9th", fee: 22000,
      students: [
        { name: "Akshara D", father: "Mallesh", phone: "8466877216" },
        { name: "Jaithra P", father: "Ramana Reddy", phone: "9440489148" },
        { name: "Niharika B", father: "Linga Swmay", phone: "9000972852" },
        { name: "Nikhila G", father: "Linga Swmay", phone: "6300578733" },
        { name: "Sanjana G", father: "Shekar", phone: "9398044780" },
        { name: "Sumayya", father: "Siraj", phone: "8247379260" },
        { name: "Shivani M", father: "Narsimha", phone: "7660931628" },
        { name: "Varshitha P", father: "Shekar", phone: "6300632050" },
        { name: "Asif", father: "Hassan", phone: "8247890390" },
        { name: "Anil", father: "Krishna", phone: "9959591164" },
        { name: "Himad SK", father: "Jamal", phone: "9866763475" },
        { name: "Rushikesh", father: "K Chary", phone: "9912208814" },
        { name: "Karthik P", father: "Anjaneyulu", phone: "7729821649" },
        { name: "Rehan", father: "Jani", phone: "9849477071" },
        { name: "Sharath", father: "Mahesh", phone: "7997264485" },
        { name: "Yashwanth M", father: "Swamy", phone: "9381034428" },
        { name: "Shiva Shankar", father: "Ravindar Reddy", phone: "9640265358" },
        { name: "Shiva Mani R", father: "Ravi", phone: "7731002760" },
        { name: "Tejaswar R", father: "Ramesh", phone: "9553425359" },
        { name: "Varshith P", father: "Shekar", phone: "9542156565" },
      ],
    },
    {
      class: "10th", fee: 25000,
      students: [
        { name: "Amrin", father: "Rahemoddin", phone: "9398657359" },
        { name: "Ayesha", father: "Shareef", phone: "9951926526" },
        { name: "Deekshitha Y", father: "Ramesh", phone: "9948969720" },
        { name: "Kavyasri P", father: "Anand", phone: "9951267369" },
        { name: "Namratha M", father: "Bhavani Shankar", phone: "9704859098" },
        { name: "Navya K", father: "Narsimha", phone: "9542040445" },
        { name: "Pranavi B", father: "Swamy", phone: "9912446474" },
        { name: "Sravya Ch", father: "Nagaraju", phone: "9963446992" },
        { name: "Srivally P", father: "Mallesham", phone: "9989103811" },
        { name: "Sindu B", father: "Lingaiah", phone: "9912353209" },
        { name: "Tejasri A", father: "Srinivas Reddy", phone: "9912803302" },
        { name: "Teju N", father: "Lingaswamy", phone: "8499832372" },
        { name: "Zeba", father: "Shabeer", phone: "9010694022" },
        { name: "Charan K", father: "Naresh", phone: "9703476050" },
        { name: "Charan G", father: "Narendar", phone: "9705434135" },
        { name: "Deekshith A", father: "Murali", phone: "6300217199" },
        { name: "Manikanta P", father: "Anjaneyulu", phone: "7729821649" },
        { name: "Vikas P", father: "Mallesh", phone: "9666030665" },
      ],
    },
  ];

  try {
    // Delete existing demo students (keep the ones with user_id linked)
    await supabase.from("fee_payments").delete().not("student_id", "is", null);
    await supabase.from("students").delete().is("user_id", null);

    let totalInserted = 0;

    for (const cls of classData) {
      const students = cls.students
        .filter(s => s.name.trim())
        .map((s, idx) => ({
          student_id: `STU-${cls.class.replace(/\s/g, "")}-${String(idx + 1).padStart(3, "0")}`,
          full_name: s.name.trim(),
          class: cls.class,
          section: "A",
          roll_no: idx + 1,
          parent_name: s.father.trim(),
          parent_phone: s.phone || "0000000000",
          total_fee: cls.fee,
        }));

      if (students.length > 0) {
        const { error } = await supabase.from("students").insert(students);
        if (error) {
          console.error(`Error inserting class ${cls.class}:`, error.message);
        } else {
          totalInserted += students.length;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, totalInserted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
