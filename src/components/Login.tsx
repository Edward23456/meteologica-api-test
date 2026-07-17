"use client";
import { useForm } from "@tanstack/react-form";
import { Input } from "./ui/input";
import { useState } from "react";
import { Button } from "./ui/button";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { RiLoader4Fill } from "react-icons/ri";
import { motion } from "motion/react";
import z from "zod";
import { useMutation } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { loginRequest } from "@/lib/api/auth";

const formSchema = z.object({
  user: z.string().min(3, "User must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginComponent() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      Cookies.set("token", data.token, {
        expires: 7,
        secure: true,
        sameSite: "strict",
      });
      router.push("/");
    },
    onError: (error) => {
      console.error("Login error:", error);
    },
  });

  const form = useForm({
    defaultValues: {
      user: "",
      password: "",
    },
    validators: { onChange: formSchema },
    onSubmit: async ({ value }) => {
      loginMutation.mutate(value);
    },
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <motion.h1
        className="text-3xl text-green-500 font-bold uppercase"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 12,
          mass: 0.8,
        }}
      >
        <span className="text-black">Meteo</span>logica API
      </motion.h1>

      <motion.div
        className="mt-10 flex w-full max-w-md flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 14,
          mass: 0.8,
          delay: 0.15,
        }}
      >
        <h1 className="text-2xl font-bold text-center">Welcome back!</h1>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.Field
            name="user"
            validators={{
              onChange: ({ value }) =>
                !value
                  ? "User is required"
                  : value.length < 3
                    ? "User must be at least 3 characters"
                    : undefined,
              onChangeAsyncDebounceMs: 500,
              onChangeAsync: async ({ value }) => {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                return value.includes("error") && 'No "error" allowed in user';
              },
            }}
          >
            {(field) => (
              <div className="flex flex-col gap-2">
                <label htmlFor={field.name}>User:</label>
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder="Enter your username"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.isTouched && !field.state.meta.isValid && (
                  <em className="text-sm text-red-500 not-italic">
                    {field.state.meta.errors
                      .map((err) => {
                        if (typeof err === "string") return err;
                        if (
                          err &&
                          typeof err === "object" &&
                          "message" in err
                        ) {
                          return err.message;
                        }
                        return null;
                      })
                      .filter(Boolean)
                      .join(", ")}
                  </em>
                )}
              </div>
            )}
          </form.Field>
          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) =>
                !value
                  ? "Password is required"
                  : value.length < 6
                    ? "Password must be at least 6 characters"
                    : undefined,
            }}
          >
            {(field) => (
              <div className="flex flex-col gap-2">
                <label htmlFor={field.name}>Password:</label>
                <div className="relative">
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                    tabIndex={-1}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {field.state.meta.isTouched && !field.state.meta.isValid && (
                  <em className="text-sm text-red-500 not-italic">
                    {field.state.meta.errors
                      .map((err) =>
                        typeof err === "string" ? err : err?.message,
                      )
                      .join(", ")}
                  </em>
                )}
              </div>
            )}
          </form.Field>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                className="cursor-pointer mt-4"
                disabled={!canSubmit}
              >
                {isSubmitting ? (
                  <RiLoader4Fill className="animate-spin" />
                ) : (
                  "Submit"
                )}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </motion.div>
    </div>
  );
}
