
import React from "react";
import { motion } from "framer-motion";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  MapPin, 
  Phone, 
  Mail,
  ChevronRight
} from "lucide-react";

const Footer: React.FC = () => {
  const footerLinks = [
    {
      title: "Company",
      links: [
        { name: "About Us", href: "#" },
        { name: "Our Services", href: "#services" },
        { name: "Contact Us", href: "#" },
        { name: "Careers", href: "#" },
      ],
    },
    {
      title: "Services",
      links: [
        { name: "Food Delivery", href: "#" },
        { name: "Grocery Booking", href: "#" },
        { name: "Car Wash", href: "#" },
        { name: "Meat Products", href: "#" },
      ],
    },
    {
      title: "Support",
      links: [
        { name: "Help Center", href: "#" },
        { name: "Terms of Service", href: "#" },
        { name: "Legal", href: "#" },
        { name: "Privacy Policy", href: "#" },
      ],
    },
  ];

  const contactInfo = [
    {
      icon: <MapPin size={18} />,
      text: "123 Innovation Street, Tech City, 90210",
    },
    {
      icon: <Phone size={18} />,
      text: "+1 (555) 123-4567",
    },
    {
      icon: <Mail size={18} />,
      text: "contact@rabitbee.com",
    },
  ];

  const socialLinks = [
    { icon: <Facebook size={20} />, href: "#" },
    { icon: <Twitter size={20} />, href: "#" },
    { icon: <Instagram size={20} />, href: "#" },
    { icon: <Linkedin size={20} />, href: "#" },
  ];

  return (
    <footer className="bg-rabitbee-bg px-6 md:px-12 pt-16 pb-8">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="text-white text-3xl font-bold mb-6">
                <span className="text-rabitbee">Rabit</span>Bee
              </div>
              <p className="text-white/70 mb-8 max-w-md">
                RabitBee is your reliable partner for fast and efficient delivery services. We connect you with the best local food, groceries, and services right at your doorstep.
              </p>
              
              <div className="space-y-4">
                {contactInfo.map((item, i) => (
                  <div key={i} className="flex items-center text-white/70">
                    <div className="text-rabitbee mr-3">{item.icon}</div>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex space-x-4 mt-8">
                {socialLinks.map((item, i) => (
                  <motion.a
                    key={i}
                    href={item.href}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-rabitbee hover:text-white transition-colors duration-300"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {item.icon}
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>
          
          {footerLinks.map((column, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="text-white font-bold text-lg mb-6">{column.title}</h3>
              <ul className="space-y-4">
                {column.links.map((link, j) => (
                  <li key={j}>
                    <a 
                      href={link.href} 
                      className="text-white/70 hover:text-rabitbee transition-colors duration-200 flex items-center"
                    >
                      <ChevronRight size={16} className="mr-2 text-rabitbee" />
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
        
        <div className="border-t border-white/10 mt-12 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/50 text-sm">
              © {new Date().getFullYear()} RabitBee. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-white/50 text-sm hover:text-rabitbee">
                Privacy Policy
              </a>
              <a href="#" className="text-white/50 text-sm hover:text-rabitbee">
                Terms of Service
              </a>
              <a href="#" className="text-white/50 text-sm hover:text-rabitbee">
                Cookies Settings
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
