
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, X } from "lucide-react";

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "Home", href: "#" },
    { name: "Services", href: "#services" },
    { name: "About Us", href: "#about" },
    { name: "Download App", href: "#download" },
  ];

  const navVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
      }
    }
  };

  const mobileMenuVariants = {
    closed: { 
      opacity: 0,
      x: "100%",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40
      }
    },
    open: { 
      opacity: 1,
      x: "0%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  return (
    <>
      <motion.nav
        initial="hidden"
        animate="visible"
        variants={navVariants}
        className={`fixed top-0 left-0 right-0 z-50 px-6 md:px-12 transition-all duration-300 ${
          isScrolled
            ? "py-3 bg-rabitbee-gradient/95 backdrop-blur-md shadow-lg"
            : "py-6 bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <motion.div 
              className="text-white font-bold text-2xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-rabitbee">Rabit</span>Bee
            </motion.div>
          </div>

          {/* Desktop Menu */}
          {!isMobile && (
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item, i) => (
                <motion.a
                  key={i}
                  href={item.href}
                  className="text-white hover:text-rabitbee transition-colors relative group"
                  whileHover={{ scale: 1.05 }}
                >
                  {item.name}
                  <motion.span
                    className="absolute bottom-0 left-0 w-0 h-0.5 bg-rabitbee group-hover:w-full transition-all duration-300"
                    layoutId="underline"
                  />
                </motion.a>
              ))}
              <motion.button
                className="bg-rabitbee text-white py-2 px-6 rounded-full hover:bg-rabitbee-light transition-colors button-shine"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Order Now
              </motion.button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          {isMobile && (
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="block md:hidden text-white"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      {isMobile && (
        <motion.div
          variants={mobileMenuVariants}
          initial="closed"
          animate={mobileMenuOpen ? "open" : "closed"}
          className="fixed top-0 right-0 h-screen w-3/4 bg-rabitbee-gradient backdrop-blur-lg z-40 pt-20 px-8 shadow-xl"
        >
          <div className="flex flex-col space-y-8">
            {navItems.map((item, i) => (
              <motion.a
                key={i}
                href={item.href}
                className="text-white text-xl hover:text-rabitbee transition-colors"
                onClick={() => setMobileMenuOpen(false)}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  transition: { delay: 0.1 * i }
                }}
              >
                {item.name}
              </motion.a>
            ))}
            <motion.button
              className="bg-rabitbee text-white py-3 px-8 rounded-full hover:bg-rabitbee-light transition-colors mt-4 button-shine"
              whileTap={{ scale: 0.95 }}
            >
              Order Now
            </motion.button>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default Navbar;
